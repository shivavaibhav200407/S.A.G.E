import os
import re
import time
from typing import Dict, Any, List, Optional
from rag import rag_db
from knowledge_graph import (
    DOMAIN_TRACKS,
    DOMAIN_META,
    detect_domain,
    find_topic_key,
    detect_prerequisite_gaps,
    get_all_prerequisites
)
from llm_client import call_llm

_PDF_DIAGNOSTIC_CACHE: Dict[tuple, tuple] = {}
_CACHE_TTL_SECONDS = 900  # 15 minutes


def get_document_chunks(doc_name: str) -> List[Dict[str, Any]]:
    """Retrieves all chunk documents and metadata for a specific document name from ChromaDB."""
    try:
        results = rag_db.collection.get()
        docs = results.get("documents", [])
        metas = results.get("metadatas", [])
        
        matching_chunks = []
        doc_name_lower = doc_name.lower().strip()

        for doc_text, meta in zip(docs, metas):
            if not meta:
                continue
            meta_doc = str(meta.get("doc_name") or meta.get("source") or "").lower().strip()
            if doc_name_lower == meta_doc or doc_name_lower in meta_doc or meta_doc in doc_name_lower:
                matching_chunks.append({
                    "text": doc_text,
                    "source": meta.get("source", doc_name),
                    "page": meta.get("page", 1)
                })
        return matching_chunks
    except Exception as e:
        print(f"[PDF Diagnostic] Error retrieving chunks for '{doc_name}': {e}")
        return []


def align_document_with_knowledge_graph(doc_name: str) -> Dict[str, Any]:
    """
    Analyzes document chunks from ChromaDB and aligns them with the SAGE Knowledge Graph.
    Identifies the primary domain, matching subtopic modules, and prerequisite competencies.
    """
    chunks = get_document_chunks(doc_name)
    
    if not chunks:
        # Fallback if document not found in vector store
        dom = detect_domain(doc_name)
        track = DOMAIN_TRACKS.get(dom, {})
        topic_titles = [v["title"] for v in track.values()][:3]
        return {
            "doc_name": doc_name,
            "domain": dom,
            "domain_title": DOMAIN_META.get(dom, {}).get("name", dom.upper()),
            "aligned_topics": topic_titles,
            "prerequisites": [],
            "total_chunks": 0,
            "sample_context": f"Document {doc_name} mapped to {dom.upper()} track."
        }

    # Aggregate excerpt text for concept alignment (up to ~2500 characters)
    combined_sample = ""
    for c in chunks:
        if len(combined_sample) < 2500:
            combined_sample += c["text"] + "\n"
        else:
            break

    # 1. Detect target domain using document name and chunk contents
    combined_query = f"{doc_name}\n{combined_sample[:1000]}"
    domain = detect_domain(combined_query)
    track = DOMAIN_TRACKS.get(domain, {})
    meta = DOMAIN_META.get(domain, {})

    # 2. Score and identify aligned subtopics in the domain
    aligned_topic_keys = []
    aligned_topic_titles = []
    text_lower = combined_sample.lower()

    for t_key, t_info in track.items():
        t_title = t_info["title"].lower()
        title_words = [w for w in re.split(r'[\s,&/]+', t_title) if len(w) > 3]
        match_count = sum(1 for w in title_words if w in text_lower)
        
        if match_count >= 1 or t_key in text_lower:
            aligned_topic_keys.append(t_key)
            aligned_topic_titles.append(t_info["title"])

    # Fallback to top modules in domain if text was too generic
    if not aligned_topic_titles:
        for t_key, t_info in list(track.items())[:3]:
            aligned_topic_keys.append(t_key)
            aligned_topic_titles.append(t_info["title"])

    # 3. Detect prerequisite competencies from the knowledge graph
    prereqs = []
    for key in aligned_topic_keys:
        p_list = get_all_prerequisites(key, domain=domain)
        for p in p_list:
            if p in track and track[p]["title"] not in prereqs:
                prereqs.append(track[p]["title"])

    return {
        "doc_name": doc_name,
        "domain": domain,
        "domain_title": meta.get("name", domain.upper()),
        "aligned_topics": aligned_topic_titles[:4],
        "prerequisites": prereqs[:3],
        "total_chunks": len(chunks),
        "sample_context": combined_sample[:1800]
    }


def parse_quiz_markdown(raw_quiz: str, fallback_topic: str) -> List[Dict[str, Any]]:
    """Converts numbered quiz text with options into structured JSON question list."""
    parsed_questions = []
    # Split on question numbers e.g. "1.", "1)", "### 1.", "**1.**", "Question 1:", "## Question 1"
    blocks = re.split(r'\n(?=(?:#{1,4}\s*)?(?:\*\*)?(?:Question\s*)?\d+[\.\):]|\[Concept:)', raw_quiz.strip(), flags=re.IGNORECASE)
    
    for idx, b in enumerate(blocks):
        b = b.strip()
        if not b:
            continue
        lines = b.split('\n')
        q_lines = []
        options = []
        concept_tag = ""

        for line in lines:
            line_s = line.strip()
            if not line_s:
                continue

            # Check for concept tag: [Concept: ...], **Concept:** ..., Concept: ...
            concept_match = re.search(r'\[Concept:\s*([^\]]+)\]', line_s, re.IGNORECASE)
            if not concept_match:
                concept_match = re.search(r'(?:\*\*Concept:\*\*|Concept:)\s*([^\n\*]+)', line_s, re.IGNORECASE)
            if concept_match:
                concept_tag = concept_match.group(1).strip()
                continue
            
            # Check for option prefix: A), B), C), D), - A), * A), **A)**, (A), etc.
            opt_match = re.match(r'^(?:[\-\*•]\s*)?(?:\*\*)?(?:\()?([A-Da-d])[\)\.\:](?:\))?(?:\*\*)?\s*(.+)$', line_s)
            if opt_match:
                cleaned_opt = opt_match.group(2).strip()
                cleaned_opt = re.sub(r'^\*\*(.*?)\*\*$', r'\1', cleaned_opt).strip()
                options.append(cleaned_opt)
            else:
                # Filter out pure markdown headings or question number labels
                cleaned_line = re.sub(r'^(?:#{1,4}\s*)?(?:\*\*)?(?:Question\s*)?\d+[\.\):]\s*(?:\*\*)?', '', line_s).strip()
                if cleaned_line:
                    q_lines.append(cleaned_line)

        q_text = ' '.join(q_lines).strip()
        q_text = re.sub(r'^(?:Question\s*)?\d+[\.\):]\s*', '', q_text, flags=re.IGNORECASE).strip()

        if q_text and len(options) >= 2:
            parsed_questions.append({
                "id": len(parsed_questions) + 1,
                "question": q_text,
                "options": options[:4],
                "concept": concept_tag or fallback_topic
            })

    # If parsing produced fewer than 2 questions, fallback to domain-adaptive questions
    if len(parsed_questions) < 2:
        parsed_questions = [
            {
                "id": 1,
                "question": f"Based on '{fallback_topic}', what is the primary architectural concept highlighted in the document?",
                "options": [
                    "Structured modular decomposition & invariant enforcement",
                    "Unbounded linear scanning without indexing",
                    "Ignoring state boundaries and isolation",
                    "Arbitrary unmanaged runtime allocation"
                ],
                "concept": fallback_topic
            },
            {
                "id": 2,
                "question": f"Which design principle is critical when implementing solutions in {fallback_topic}?",
                "options": [
                    "Deterministic state verification & defensive error handling",
                    "Asynchronous suppression without logging",
                    "Unchecked recursive invocation without base conditions",
                    "Global shared variable mutability"
                ],
                "concept": fallback_topic
            },
            {
                "id": 3,
                "question": f"How does the engineering curriculum structure prerequisites for {fallback_topic}?",
                "options": [
                    "Hierarchical competency progression with dependency validation",
                    "Random non-linear jump scheduling",
                    "Strictly alphabetical ordering",
                    "Single-step flat memorization"
                ],
                "concept": fallback_topic
            }
        ]

    return parsed_questions


def generate_pdf_diagnostic_assessment(doc_name: str, topic: Optional[str] = None) -> Dict[str, Any]:
    """
    Grounded PDF Diagnostic Assessment Generator.
    Extracts chunks from ChromaDB, aligns with Knowledge Graph, and generates
    concept-tagged multiple-choice diagnostic questions grounded directly in the document.
    """
    alignment = align_document_with_knowledge_graph(doc_name)
    aligned_topics = alignment.get("aligned_topics", [])

    # Determine authentic primary topic:
    # If topic is not provided, or is empty, or is the generic default 'Java Basics & Primitive Types',
    # or does not match the detected domain when aligned topics exist:
    generic_defaults = {"java basics & primitive types", "general engineering", ""}
    clean_topic = (topic or "").strip()

    if (not clean_topic or 
        clean_topic.lower() in generic_defaults or 
        (aligned_topics and clean_topic not in aligned_topics and alignment["domain"] != detect_domain(clean_topic))):
        primary_topic = aligned_topics[0] if aligned_topics else doc_name
    else:
        primary_topic = clean_topic

    cache_key = (doc_name.lower().strip(), primary_topic.lower().strip())
    now = time.time()

    if cache_key in _PDF_DIAGNOSTIC_CACHE:
        cached_time, cached_data = _PDF_DIAGNOSTIC_CACHE[cache_key]
        if now - cached_time < _CACHE_TTL_SECONDS:
            print(f"[PERF] Serving cached PDF diagnostic for document '{doc_name}' ({primary_topic})")
            return cached_data

    subconcepts_str = ", ".join(aligned_topics) if aligned_topics else primary_topic

    system_prompt = (
        "You are the SAGE PDF Diagnostic Assessment Agent.\n"
        "Your mission is to generate 3 diagnostic multiple-choice questions STRICTLY GROUNDED in the provided "
        "document excerpts and aligned with the SAGE Knowledge Graph curriculum.\n\n"
        "CRITICAL GROUNDING RULES:\n"
        f"1. Source Document: '{doc_name}'\n"
        f"2. Aligned Domain Track: {alignment['domain_title']}\n"
        f"3. Aligned Concepts: {subconcepts_str}\n"
        "4. Each question MUST begin with a number and '[Concept: <Specific Aligned Concept>]'.\n"
        "5. Provide exactly 4 options: A), B), C), D).\n"
        "6. Do NOT include answers or solutions. Output only the 3 formatted questions with options."
    )

    prompt = (
        f"Source Document Context (from '{doc_name}'):\n"
        f"\"\"\"\n{alignment['sample_context']}\n\"\"\"\n\n"
        f"Generate 3 diagnostic multiple-choice questions grounded in the context above for '{primary_topic}'.\n\n"
        "Format each question exactly like this:\n\n"
        "1. [Concept: Concept Name]\n"
        "Question text?\n"
        "A) Option 1\n"
        "B) Option 2\n"
        "C) Option 3\n"
        "D) Option 4\n\n"
        "2. [Concept: Concept Name]\n"
        "Question text?\n"
        "A) Option 1\n"
        "B) Option 2\n"
        "C) Option 3\n"
        "D) Option 4\n\n"
        "3. [Concept: Concept Name]\n"
        "Question text?\n"
        "A) Option 1\n"
        "B) Option 2\n"
        "C) Option 3\n"
        "D) Option 4"
    )

    raw_response = call_llm(prompt, system_prompt)
    parsed_questions = parse_quiz_markdown(raw_response, primary_topic)

    result_payload = {
        "doc_name": doc_name,
        "domain": alignment["domain"],
        "domain_title": alignment["domain_title"],
        "aligned_topics": alignment["aligned_topics"],
        "prerequisites": alignment["prerequisites"],
        "primary_topic": primary_topic,
        "quiz_type": "diagnostic",
        "raw_text": raw_response,
        "questions": parsed_questions,
        "total_questions": len(parsed_questions)
    }

    if parsed_questions:
        _PDF_DIAGNOSTIC_CACHE[cache_key] = (now, result_payload)

    return result_payload
