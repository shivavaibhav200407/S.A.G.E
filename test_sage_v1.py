import os
import io
import sys
import unittest

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

class TestSAGEv1Architecture(unittest.TestCase):

    def test_01_domain_detection_and_taxonomies(self):
        """Test domain detection correctly isolates Java, Python, and RAG/AI tracks."""
        from knowledge_graph import detect_domain, DOMAIN_TRACKS

        self.assertEqual(detect_domain("Java Collections & ArrayList"), "java")
        self.assertEqual(detect_domain("String Pool & Immutability"), "java")
        self.assertEqual(detect_domain("Python OOP & Classes"), "python")
        self.assertEqual(detect_domain("AsyncIO & Event Loop"), "python")
        self.assertEqual(detect_domain("Document Chunking & Embeddings"), "rag_ai")
        self.assertEqual(detect_domain("Vector Databases (ChromaDB)"), "rag_ai")

        self.assertIn("java", DOMAIN_TRACKS)
        self.assertIn("python", DOMAIN_TRACKS)
        self.assertIn("rag_ai", DOMAIN_TRACKS)

    def test_02_concept_grounding_no_hallucination(self):
        """Verify Java quiz scoring never hallucinates Document Chunking or AI concepts."""
        from evaluator_agent import run_evaluator_agent

        simulated_input = (
            "Topic: Java Memory Model & String Pool\n"
            "Domain: Java\n"
            "Question 1 (Concept: String Pool & Immutability): I think String s1 = 'a' and s2 = new String('a') are identical references.\n"
            "Question 2 (Concept: ArrayList Dynamic Resizing): ArrayList doubles internally when capacity is full.\n"
            "Question 3 (Concept: Generics & Type Erasure): Types are erased at runtime.\n"
        )

        res = run_evaluator_agent(simulated_input)
        weaks = res.detected_weak_topics
        self.assertIsInstance(res.score, int)
        self.assertGreaterEqual(res.score, 0)
        self.assertLessEqual(res.score, 3)

        # Assert no AI/RAG topics leaked into Java evaluation
        for w in weaks:
            self.assertNotIn("Chunking", w)
            self.assertNotIn("Embeddings", w)
            self.assertNotIn("RAG", w)
            self.assertNotIn("Vector", w)

    def test_03_chromadb_semantic_rag(self):
        """Verify ChromaDB semantic ingestion, vector search, document listing and deletion."""
        from rag import rag_db, search_knowledge_base

        test_note = (
            "Java ArrayList is backed by a dynamically resizing array. When capacity is exceeded, "
            "it grows by approximately 50 percent (newCapacity = oldCapacity + (oldCapacity >> 1))."
        )
        count = rag_db.ingest_text(test_note, source_name="ArrayList_Internals_Doc")
        self.assertGreater(count, 0)

        hits = search_knowledge_base("How does ArrayList increase its size when full?", top_k=2)
        self.assertTrue(len(hits) > 0)
        top_hit = hits[0]
        self.assertIn("ArrayList", top_hit["text"])
        self.assertIn("ArrayList_Internals_Doc", top_hit["source"])

        # Test document listing
        docs = rag_db.list_documents()
        doc_names = [d["name"] for d in docs]
        self.assertIn("ArrayList_Internals_Doc", doc_names)

    def test_04_live_research_agent(self):
        """Verify Research Agent executes web search and synthesizes findings."""
        from research_agent import run_research_agent

        res = run_research_agent("Java Virtual Threads Project Loom", domain="java")
        self.assertIn("query", res)
        self.assertIn("synthesized_summary", res)
        self.assertTrue(len(res["synthesized_summary"]) > 20)

    def test_05_verifier_agent_guardrails(self):
        """Verify Verifier Agent inspects explanations and returns structured feedback."""
        from verifier_agent import verify_explanation

        res = verify_explanation(
            explanation="Python's asyncio runs a single-threaded cooperative multitasking event loop.",
            context="The event loop is the core of every asyncio application in Python.",
            domain="python"
        )
        self.assertIn("is_grounded", res)
        self.assertIn("confidence_score", res)
        self.assertGreaterEqual(res["confidence_score"], 0.0)

    def test_06_supervisor_multi_agent_session(self):
        """Verify Supervisor coordinates multi-agent trace and intent classification."""
        from supervisor import supervise_learning_session, classify_user_intent

        self.assertEqual(classify_user_intent("Hello SAGE!"), "greeting")
        self.assertEqual(classify_user_intent("What should I learn today?"), "study_plan")
        self.assertEqual(classify_user_intent("Give me a quiz on Java"), "quiz_request")
        self.assertEqual(classify_user_intent("Explain how virtual memory paging works"), "technical")

        trace_res = supervise_learning_session("Explain Java ArrayList resizing with source docs")
        self.assertIn("response", trace_res)
        self.assertIn("verification", trace_res)
        self.assertIn("domain", trace_res)
        self.assertEqual(trace_res["domain"], "java")
        self.assertIn("agent_trace", trace_res)

    def test_07_learning_cycle_state_machine(self):
        """Verify autonomous closed-loop learning cycle transitions."""
        from supervisor import step_learning_cycle

        status = step_learning_cycle(action="status")
        self.assertEqual(status["status"], "success")
        self.assertIn("current_state", status)
        self.assertIn("target_topic", status)

if __name__ == "__main__":
    unittest.main()
