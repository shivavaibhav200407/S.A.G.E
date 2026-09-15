import sys
from typing import List, Dict, Any, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Domain Curricula
DOMAIN_TRACKS: Dict[str, Dict[str, Dict[str, Any]]] = {
    "java": {
        "java_basics": {
            "title": "Java Basics & Primitive Types",
            "description": "JVM architecture, primitive types, bytecode, and basic operators.",
            "prerequisites": [],
            "order": 1,
        },
        "java_control_flow": {
            "title": "Control Flow & Methods",
            "description": "Conditionals, switch expressions, loops, and method signatures.",
            "prerequisites": ["java_basics"],
            "order": 2,
        },
        "oop_fundamentals": {
            "title": "OOP: Classes, Objects & Encapsulation",
            "description": "Constructors, access modifiers, getters/setters, and object lifecycle.",
            "prerequisites": ["java_control_flow"],
            "order": 3,
        },
        "string_pool_memory": {
            "title": "String Pool, Immutability & Memory",
            "description": "String literals vs new String(), heap vs stack, and == vs .equals().",
            "prerequisites": ["oop_fundamentals"],
            "order": 4,
        },
        "exception_handling": {
            "title": "Exceptions & Try-With-Resources",
            "description": "Checked vs unchecked exceptions, AutoCloseable, and try-with-resources.",
            "prerequisites": ["oop_fundamentals"],
            "order": 5,
        },
        "collections_framework": {
            "title": "Collections Framework (ArrayList, HashMap)",
            "description": "List vs Set vs Map, internal hashing in HashMap, and ArrayList resizing.",
            "prerequisites": ["string_pool_memory", "exception_handling"],
            "order": 6,
        },
        "generics": {
            "title": "Java Generics & Type Erasure",
            "description": "Type parameters, bounded wildcards (? extends T), and runtime type erasure.",
            "prerequisites": ["collections_framework"],
            "order": 7,
        },
        "concurrency": {
            "title": "Java Concurrency & Multithreading",
            "description": "Threads, synchronization, volatile, ExecutorService, and thread safety.",
            "prerequisites": ["collections_framework"],
            "order": 8,
        },
        "streams_and_lambdas": {
            "title": "Streams API & Modern Java",
            "description": "Functional interfaces, lambda expressions, map/filter/reduce, and ParallelStreams.",
            "prerequisites": ["generics", "collections_framework"],
            "order": 9,
        },
    },
    "python": {
        "python_basics": {
            "title": "Python Basics & Syntax",
            "description": "Variables, basic data types (int, float, str, bool), and fundamental operators.",
            "prerequisites": [],
            "order": 1,
        },
        "control_flow": {
            "title": "Control Flow & Loops",
            "description": "If/else conditionals, for loops, while loops, and loop control statements.",
            "prerequisites": ["python_basics"],
            "order": 2,
        },
        "data_structures": {
            "title": "Data Structures (Lists, Dicts, Sets)",
            "description": "Lists, dictionaries, tuples, sets, hashing, and dictionary key collision resolution.",
            "prerequisites": ["python_basics"],
            "order": 3,
        },
        "functions_and_scope": {
            "title": "Functions & Scope",
            "description": "Function definitions, args/kwargs, return values, default arguments, and LEGB scope.",
            "prerequisites": ["control_flow", "data_structures"],
            "order": 4,
        },
        "oop_python": {
            "title": "Object-Oriented Python",
            "description": "Classes, dunder methods (__init__, __repr__), inheritance, and polymorphism.",
            "prerequisites": ["functions_and_scope"],
            "order": 5,
        },
        "decorators_and_generators": {
            "title": "Decorators & Generators",
            "description": "Higher-order functions, closures, decorators with arguments, and yield expressions.",
            "prerequisites": ["functions_and_scope"],
            "order": 6,
        },
    },
    "rag_ai": {
        "embeddings": {
            "title": "Embeddings & Vector Spaces",
            "description": "Converting text into dense numerical vectors, cosine similarity, and semantic similarity.",
            "prerequisites": [],
            "order": 1,
        },
        "chunking_and_preprocessing": {
            "title": "Document Chunking & Preprocessing",
            "description": "Splitting documents into chunks, chunk overlap, token limits, and text cleanup.",
            "prerequisites": [],
            "order": 2,
        },
        "vector_databases": {
            "title": "Vector Databases & ANN Search",
            "description": "Indexing embedding vectors in ChromaDB/Pinecone, approximate nearest neighbors (ANN).",
            "prerequisites": ["embeddings", "chunking_and_preprocessing"],
            "order": 3,
        },
        "rag": {
            "title": "Retrieval-Augmented Generation (RAG)",
            "description": "Augmenting LLM prompts with relevant retrieved knowledge chunks for grounded answers.",
            "prerequisites": ["vector_databases"],
            "order": 4,
        },
        "agentic_ai": {
            "title": "Agentic AI & Tool Calling",
            "description": "Autonomous agents, ReAct loops, tool/function calling, memory, and multi-agent coordination.",
            "prerequisites": ["rag"],
            "order": 5,
        },
        "evaluation_and_reflection": {
            "title": "Evaluation, Guardrails & Self-Correction",
            "description": "Automated evaluation of agent outputs, factual verification, guardrails, and self-reflection.",
            "prerequisites": ["agentic_ai"],
            "order": 6,
        },
    },
    "javascript": {
        "js_fundamentals": {
            "title": "Modern JavaScript ES6+ & Event Loop",
            "description": "Closures, prototypes, promises, async/await, event loop, and call stack execution.",
            "prerequisites": [],
            "order": 1,
        },
        "typescript_types": {
            "title": "TypeScript Fundamentals & Strict Types",
            "description": "Interfaces, union/intersection types, generics, type narrowing, and tsconfig.",
            "prerequisites": ["js_fundamentals"],
            "order": 2,
        },
        "react_components": {
            "title": "React Architecture, Hooks & State",
            "description": "Virtual DOM, useState/useEffect/useCallback, custom hooks, and state lifecycles.",
            "prerequisites": ["typescript_types"],
            "order": 3,
        },
        "nextjs_fullstack": {
            "title": "Next.js App Router & Server Components",
            "description": "Server-side rendering (SSR), static site generation (SSG), and Server Actions.",
            "prerequisites": ["react_components"],
            "order": 4,
        },
        "node_backend": {
            "title": "Node.js & Express RESTful API Engineering",
            "description": "Middleware pipelines, REST patterns, JWT authentication, and error boundaries.",
            "prerequisites": ["js_fundamentals"],
            "order": 5,
        },
    },
    "cpp": {
        "cpp_basics": {
            "title": "C++ Memory Model & Pointers",
            "description": "Stack vs heap, pointer arithmetic, references, and memory layout.",
            "prerequisites": [],
            "order": 1,
        },
        "cpp_raii_smart_ptrs": {
            "title": "RAII & Modern Smart Pointers",
            "description": "Resource Acquisition Is Initialization, std::unique_ptr, and std::shared_ptr.",
            "prerequisites": ["cpp_basics"],
            "order": 2,
        },
        "cpp_move_semantics": {
            "title": "Move Semantics & Rvalue References",
            "description": "std::move, rvalue references (&&), move constructors, and perfect forwarding.",
            "prerequisites": ["cpp_raii_smart_ptrs"],
            "order": 3,
        },
        "cpp_templates": {
            "title": "C++ Templates & Generic Metaprogramming",
            "description": "Function and class templates, template specialization, and SFINAE/Concepts.",
            "prerequisites": ["cpp_basics"],
            "order": 4,
        },
        "cpp_stl_concurrency": {
            "title": "STL Internals & Multithreaded Systems",
            "description": "std::vector/map performance, std::thread, mutexes, and lock-free atomics.",
            "prerequisites": ["cpp_move_semantics", "cpp_templates"],
            "order": 5,
        },
    },
    "dsa": {
        "arrays_and_pointers": {
            "title": "Array Manipulation & Two Pointers",
            "description": "In-place modifications, two-pointer convergence, and sliding window patterns.",
            "prerequisites": [],
            "order": 1,
        },
        "hash_maps_and_sets": {
            "title": "Hash Tables & Frequency Counting",
            "description": "O(1) lookups, hash collision handling, prefix sums, and anagram groupings.",
            "prerequisites": ["arrays_and_pointers"],
            "order": 2,
        },
        "stacks_and_queues": {
            "title": "Stacks, Queues & Monotonic Stacks",
            "description": "LIFO/FIFO patterns, balanced parentheses, and next greater element problems.",
            "prerequisites": ["arrays_and_pointers"],
            "order": 3,
        },
        "trees_and_traversals": {
            "title": "Binary Trees, BST & DFS/BFS Traversals",
            "description": "Tree recursion, level-order traversal, binary search trees, and lowest common ancestor.",
            "prerequisites": ["stacks_and_queues"],
            "order": 4,
        },
        "dynamic_programming": {
            "title": "Dynamic Programming (1D & 2D Memoization)",
            "description": "Subproblem overlap, state transitions, memoization, and bottom-up tabulation.",
            "prerequisites": ["trees_and_traversals"],
            "order": 5,
        },
        "graph_algorithms": {
            "title": "Graph Theory (BFS, DFS & Dijkstra)",
            "description": "Adjacency lists, cycle detection, shortest paths, and topological sorting.",
            "prerequisites": ["trees_and_traversals"],
            "order": 6,
        },
    },
    "cloud_devops": {
        "linux_and_git": {
            "title": "Linux Shell Mastery & Git Workflows",
            "description": "Bash scripting, file permissions, SSH, Git rebasing, and merge conflict resolution.",
            "prerequisites": [],
            "order": 1,
        },
        "docker_containers": {
            "title": "Docker Containerization & Image Optimization",
            "description": "Dockerfiles, multi-stage builds, container networks, and volume persistence.",
            "prerequisites": ["linux_and_git"],
            "order": 2,
        },
        "kubernetes_orchestration": {
            "title": "Kubernetes Clusters & Orchestration",
            "description": "Pods, Deployments, Services, Ingress, ConfigMaps, and horizontal pod autoscaling.",
            "prerequisites": ["docker_containers"],
            "order": 3,
        },
        "cicd_pipelines": {
            "title": "CI/CD Pipelines & GitHub Actions",
            "description": "Automated testing, continuous integration workflows, Docker registry pushes, and deployment.",
            "prerequisites": ["docker_containers"],
            "order": 4,
        },
        "cloud_aws": {
            "title": "Cloud Architecture & AWS Services",
            "description": "VPCs, EC2, S3, IAM roles, serverless Lambda, and cost optimization.",
            "prerequisites": ["kubernetes_orchestration", "cicd_pipelines"],
            "order": 5,
        },
    },
    "cybersecurity": {
        "network_fundamentals": {
            "title": "Networking Protocols & Packet Analysis",
            "description": "TCP/IP three-way handshake, DNS, HTTP/HTTPS, SSL/TLS, and Wireshark inspection.",
            "prerequisites": [],
            "order": 1,
        },
        "cryptography_essentials": {
            "title": "Applied Cryptography & Public-Key Infrastructure",
            "description": "Symmetric AES vs asymmetric RSA, hashing algorithms (SHA-256), and digital certificates.",
            "prerequisites": ["network_fundamentals"],
            "order": 2,
        },
        "web_security_owasp": {
            "title": "Web Application Security (OWASP Top 10)",
            "description": "SQL injection, Cross-Site Scripting (XSS), CSRF, SSRF, and secure session management.",
            "prerequisites": ["network_fundamentals"],
            "order": 3,
        },
        "network_defense_firewalls": {
            "title": "Network Defense, Firewalls & Threat Mitigation",
            "description": "Port scanning with Nmap, IDS/IPS, WAF configurations, and Zero Trust security.",
            "prerequisites": ["web_security_owasp", "cryptography_essentials"],
            "order": 4,
        },
    },
    "ml_dl": {
        "python_for_ml": {
            "title": "Data Engineering with NumPy & Pandas",
            "description": "Vectorized computations, matrix manipulation, data cleaning, and feature encoding.",
            "prerequisites": [],
            "order": 1,
        },
        "classical_machine_learning": {
            "title": "Supervised & Unsupervised Machine Learning",
            "description": "Linear/logistic regression, decision trees, random forests, clustering, and cross-validation.",
            "prerequisites": ["python_for_ml"],
            "order": 2,
        },
        "deep_learning_pytorch": {
            "title": "Deep Learning & Neural Networks in PyTorch",
            "description": "Tensors, autograd, forward/backward pass, loss functions, optimizers, and training loops.",
            "prerequisites": ["classical_machine_learning"],
            "order": 3,
        },
        "transformers_and_llms": {
            "title": "Transformers Architecture & Modern LLMs",
            "description": "Self-attention mechanisms, encoder-decoder transformers, LoRA, and instruction tuning.",
            "prerequisites": ["deep_learning_pytorch"],
            "order": 4,
        },
    },
    "databases": {
        "relational_modeling": {
            "title": "Relational Data Modeling & Normalization",
            "description": "Entity-relationship diagrams, primary/foreign keys, 1NF to 3NF normalization rules.",
            "prerequisites": [],
            "order": 1,
        },
        "advanced_sql": {
            "title": "Advanced SQL & Analytical Window Functions",
            "description": "Complex JOINs, CTEs, window functions (ROW_NUMBER, RANK), and aggregations.",
            "prerequisites": ["relational_modeling"],
            "order": 2,
        },
        "indexing_and_performance": {
            "title": "Indexing, Query Plans & EXPLAIN ANALYZE",
            "description": "B-Tree indexes, composite indexes, query planner execution trees, and slow query tuning.",
            "prerequisites": ["advanced_sql"],
            "order": 3,
        },
        "acid_and_concurrency": {
            "title": "Transactions, ACID Guarantees & Isolation Levels",
            "description": "Read Committed vs Serializable, dirty reads, phantom reads, and MVCC concurrency.",
            "prerequisites": ["indexing_and_performance"],
            "order": 4,
        },
        "caching_and_redis": {
            "title": "In-Memory Caching & Redis Architecture",
            "description": "Cache-aside pattern, TTL eviction strategies, Redis data types, and distributed pub/sub.",
            "prerequisites": ["acid_and_concurrency"],
            "order": 5,
        },
    },
}

DOMAIN_META: Dict[str, Dict[str, str]] = {
    "java": {"name": "Java Enterprise & Core Internals", "icon": "☕", "category": "Backend", "default_topic": "Java Basics & Primitive Types"},
    "python": {"name": "Python Mastery & Advanced Patterns", "icon": "🐍", "category": "Backend", "default_topic": "Python Basics & Syntax"},
    "rag_ai": {"name": "RAG & Generative AI Systems", "icon": "🧠", "category": "AI / ML", "default_topic": "Embeddings & Vector Spaces"},
    "javascript": {"name": "Modern Full-Stack JavaScript & TypeScript", "icon": "🌐", "category": "Web Dev", "default_topic": "Modern JavaScript ES6+ & Event Loop"},
    "cpp": {"name": "C++ Systems & Low-Level Architecture", "icon": "⚡", "category": "Systems", "default_topic": "C++ Memory Model & Pointers"},
    "dsa": {"name": "Data Structures & Algorithms (LeetCode)", "icon": "🏆", "category": "CS Core", "default_topic": "Array Manipulation & Two Pointers"},
    "cloud_devops": {"name": "Cloud Computing, Docker & DevOps", "icon": "☁️", "category": "DevOps", "default_topic": "Linux Shell Mastery & Git Workflows"},
    "cybersecurity": {"name": "Cybersecurity & Ethical Hacking", "icon": "🛡️", "category": "Security", "default_topic": "Networking Protocols & Packet Analysis"},
    "ml_dl": {"name": "Machine Learning & Deep Learning", "icon": "🤖", "category": "AI / ML", "default_topic": "Data Engineering with NumPy & Pandas"},
    "databases": {"name": "Database Engineering & SQL Mastery", "icon": "💾", "category": "Databases", "default_topic": "Relational Data Modeling & Normalization"},
}

# Import and integrate complete B.Tech Engineering Curriculum catalog
try:
    from btech_courses import BTECH_COURSES, BTECH_BRANCHES
    for c_key, c_data in BTECH_COURSES.items():
        if c_key not in DOMAIN_TRACKS:
            DOMAIN_TRACKS[c_key] = {}

        sorted_course_topics = sorted(c_data["topics"].items(), key=lambda item: item[1].get("order", 1))
        prev_k = None
        for t_key, t_info in sorted_course_topics:
            if t_key not in DOMAIN_TRACKS[c_key]:
                prereqs = t_info.get("prerequisites", [prev_k] if prev_k else [])
                DOMAIN_TRACKS[c_key][t_key] = {
                    "title": t_info["title"],
                    "description": t_info.get("description", ""),
                    "prerequisites": prereqs,
                    "order": t_info.get("order", 1)
                }
            prev_k = t_key

        if c_key not in DOMAIN_META:
            DOMAIN_META[c_key] = {
                "name": c_data["name"],
                "icon": c_data.get("icon", "📘"),
                "category": c_data.get("branch_name", "Engineering"),
                "branch": c_data.get("branch", "all"),
                "semester": c_data.get("semester", ""),
                "default_topic": c_data.get("default_topic", "")
            }
        else:
            DOMAIN_META[c_key]["branch"] = c_data.get("branch", "all")
            DOMAIN_META[c_key]["semester"] = c_data.get("semester", "")
            DOMAIN_META[c_key]["name"] = c_data.get("name", DOMAIN_META[c_key]["name"])
except ImportError:
    pass

# Unified combined roadmap for backwards compatibility
TOPIC_ROADMAP: Dict[str, Dict[str, Any]] = {}
for d, track in DOMAIN_TRACKS.items():
    TOPIC_ROADMAP.update(track)

def detect_domain(query_or_topic: str) -> str:
    """Detects whether a topic or query belongs to any of the B.Tech or specialized domain tracks."""
    if not query_or_topic:
        return "python"
    q = query_or_topic.lower().strip()

    # 1. Exact or substring match in any domain track
    for dom, track in DOMAIN_TRACKS.items():
        if q == dom:
            return dom
        for key, data in track.items():
            if q == key or q == data['title'].lower() or q in data['title'].lower() or data['title'].lower() in q:
                return dom

    # 2. Domain keyword signals (ordered by specificity)
    signals = [
        # Web & Systems
        ("javascript", ["javascript", "typescript", "react", "next.js", "nextjs", "node.js", "nodejs", "express", "npm", "async/await", "dom", "tailwind", "jsx", "tsx"]),
        ("web_tech", ["web tech", "web technologies", "full-stack", "html/css"]),
        ("cpp", ["c++", "cpp", "smart pointer", "unique_ptr", "shared_ptr", "vector<", "template<", "valgrind", "memory leak", "rvalue"]),
        ("c_programming", ["c programming", "c language", "pointers in c", "malloc", "calloc", "format specifier", "stdio.h", "stdlib.h"]),
        # Core CS
        ("os", ["operating system", "operating systems", "cpu scheduling", "virtual memory", "deadlock", "semaphores", "paging", "page replacement", "disk scheduling", "system call", "round robin", "banker's algorithm", "context switch"]),
        ("dbms", ["dbms", "database management", "relational model", "normalization", "1nf", "2nf", "3nf", "bcnf", "acid properties", "concurrency control", "two-phase locking", "sql queries", "relational algebra"]),
        ("cn", ["computer network", "computer networks", "osi model", "osi layer", "tcp/ip stack", "data link layer", "routing protocol", "ip addressing", "subnetting", "sliding window protocol", "three-way handshake", "bgp", "ospf"]),
        ("toc_compiler", ["automata", "dfa", "nfa", "compiler design", "context-free grammar", "cfg", "turing machine", "pumping lemma", "lexical analysis", "syntax analysis", "parsing", "ll(1)", "lr(0)"]),
        # AI & DS
        ("rag_ai", ["vector database", "vector databases", "chroma", "rag", "embedding", "vector", "chunk", "agentic", "llm", "prompt", "retrieval", "langchain"]),
        ("ml", ["machine learning", "supervised learning", "unsupervised learning", "linear regression", "logistic regression", "random forest", "pca", "k-means", "bias-variance"]),
        ("dl", ["deep learning", "neural network", "backpropagation", "cnn", "convolutional neural", "recurrent network", "lstm", "activation function"]),
        ("ml_dl", ["pytorch", "tensorflow", "transformer", "scikit-learn", "numpy", "pandas"]),
        # Core CS
        ("databases", ["database", "sql", "postgres", "mysql", "redis", "indexing", "acid", "normalization", "mongodb", "query optimization", "b-tree", "foreign key"]),
        ("cybersecurity", ["cybersecurity", "security", "owasp", "sql injection", "xss", "csrf", "penetration", "nmap", "firewall", "cryptography", "encryption", "hashing", "packet"]),
        ("cloud_devops", ["devops", "docker", "kubernetes", "k8s", "aws", "ci/cd", "github actions", "terraform", "cloud", "linux shell", "container", "pod", "deployment"]),
        # ECE & EEE
        ("digital_logic", ["digital logic", "boolean algebra", "k-map", "karnaugh", "flip-flop", "multiplexer", "fsm", "combinational circuit", "sequential circuit", "verilog", "logic gates"]),
        ("signals_systems", ["signals and systems", "lti system", "fourier transform", "laplace transform", "z-transform", "continuous time signal", "discrete time signal", "digital filter", "convolution"]),
        ("microprocessors", ["microprocessor", "8086", "arm cortex", "assembly language", "embedded system", "peripheral interfacing", "8255", "interrupt"]),
        ("circuits_eee", ["electric circuit", "kcl", "kvl", "thevenin", "norton", "maximum power transfer", "phasor", "rlc circuit", "mesh current"]),
        # ME & CE
        ("eng_mechanics", ["strength of materials", "stress and strain", "shear force", "bending moment", "sfd", "bmd", "torsion in shafts", "hooke's law", "young's modulus"]),
        ("thermodynamics", ["thermodynamics", "first law of thermo", "second law of thermo", "carnot cycle", "entropy", "rankine cycle", "heat transfer", "fourier's law", "conduction", "convection"]),
        ("fluid_mechanics", ["fluid mechanics", "bernoulli", "hydrostatic pressure", "viscosity", "reynolds number", "continuity equation", "venturimeter", "boundary layer"]),
        ("structural_analysis", ["structural analysis", "rcc design", "truss analysis", "slope deflection", "moment distribution", "limit state method", "singly reinforced"]),
        # 1st Year Core
        ("eng_math_1", ["engineering mathematics", "eigenvalue", "eigenvector", "taylor series", "jacobian", "differential equation", "lagrange multiplier", "rank of matrix", "calculus"]),
        ("eng_physics", ["engineering physics", "wave optics", "interference", "diffraction", "he-ne laser", "optical fiber", "schrodinger", "fermi level", "semiconductor physics"]),
        ("beee", ["beee", "basic electrical", "transformer", "induction motor", "p-n junction", "zener diode", "rectifier", "star delta"]),
        # Programming
        ("java", ["java", "jvm", "spring", "arraylist", "try-with-resources", "hashmap", "string pool", "generics", "concurrency", "thread", "servlet"]),
        ("python", ["python", "decorator", "generator", "dunder", "lambda", "django", "flask", "list comprehension"]),
    ]

    for dom, kws in signals:
        for kw in kws:
            if kw == "java" and "javascript" in q:
                continue
            if kw in q:
                return dom

    return "python"

def find_topic_key(query: str, domain: Optional[str] = None) -> Optional[str]:
    """Matches a string or query against the roadmap keys and titles within the relevant domain."""
    if not query:
        return None
    q = query.lower().strip()
    active_map = DOMAIN_TRACKS.get(domain, TOPIC_ROADMAP) if domain else TOPIC_ROADMAP
    
    # 1. Exact key match
    if q in active_map:
        return q
    # 2. Match in title or key
    for key, data in active_map.items():
        if q in key or key in q or q in data['title'].lower() or data['title'].lower() in q:
            return key
            
    # 3. Domain-specific keyword mapping
    keyword_map = {
        # Java
        'arraylist': 'collections_framework',
        'hashmap': 'collections_framework',
        'collection': 'collections_framework',
        'string comparison': 'string_pool_memory',
        'string pool': 'string_pool_memory',
        'try-with-resources': 'exception_handling',
        'exception': 'exception_handling',
        'concurrency': 'concurrency',
        'stream': 'streams_and_lambdas',
        # AI
        'rag': 'rag',
        'retrieval': 'rag',
        'chunk': 'chunking_and_preprocessing',
        'embedding': 'embeddings',
        'vector': 'vector_databases',
        'agent': 'agentic_ai',
        # Python
        'decorator': 'decorators_and_generators',
        'generator': 'decorators_and_generators',
        'dict': 'data_structures',
        'list': 'data_structures',
    }
    for kw, key in keyword_map.items():
        if kw in q and key in active_map:
            return key
    return None

def get_all_prerequisites(key: str, domain: Optional[str] = None, visited: Optional[set] = None) -> List[str]:
    """Recursively retrieves all direct and indirect prerequisites in topological order within domain."""
    if visited is None:
        visited = set()
    active_map = DOMAIN_TRACKS.get(domain, TOPIC_ROADMAP) if domain else TOPIC_ROADMAP
    if key not in active_map or key in visited:
        return []
    visited.add(key)
    result = []
    direct = active_map[key].get('prerequisites', [])
    for p in direct:
        for ancestor in get_all_prerequisites(p, domain, visited):
            if ancestor not in result:
                result.append(ancestor)
        if p not in result:
            result.append(p)
    return result

def detect_prerequisite_gaps(
    target_topic_name: str,
    weak_topics: List[str],
    completed_modules: List[str],
    domain: Optional[str] = None
) -> List[Dict[str, str]]:
    """Detects missing or weak prerequisites strictly within the topic's own domain curriculum."""
    dom = domain or detect_domain(target_topic_name)
    key = find_topic_key(target_topic_name, dom)
    if not key:
        return []

    active_map = DOMAIN_TRACKS.get(dom, TOPIC_ROADMAP)
    prereqs = get_all_prerequisites(key, dom)
    gaps = []

    completed_keys = set()
    for c in completed_modules:
        k = find_topic_key(c, dom)
        if k:
            completed_keys.add(k)

    weak_keys = set()
    for w in weak_topics:
        k = find_topic_key(w, dom)
        if k:
            weak_keys.add(k)
        else:
            w_lower = w.lower()
            for r_key, r_data in active_map.items():
                if w_lower in r_key or w_lower in r_data['title'].lower():
                    weak_keys.add(r_key)

    for prereq_key in prereqs:
        if prereq_key not in active_map:
            continue
        prereq_info = active_map[prereq_key]
        if prereq_key in weak_keys:
            gaps.append({
                'key': prereq_key,
                'title': prereq_info['title'],
                'reason': f"Identified weakness in '{prereq_info['title']}'",
                'type': 'weakness'
            })
        elif prereq_key not in completed_keys:
            gaps.append({
                'key': prereq_key,
                'title': prereq_info['title'],
                'reason': f"Prerequisite '{prereq_info['title']}' has not been completed yet",
                'type': 'uncompleted'
            })

    # Sort gaps: weaknesses first (most critical), then uncompleted
    gaps.sort(key=lambda g: 0 if g.get('type') == 'weakness' else 1)
    return gaps

def get_next_topic(
    completed_modules: List[str],
    current_topic: Optional[str] = None,
    domain: Optional[str] = None
) -> Dict[str, Any]:
    """Finds the next optimal topic in the student's domain curriculum tree."""
    dom = domain or (detect_domain(current_topic) if current_topic else "python")
    active_map = DOMAIN_TRACKS.get(dom, DOMAIN_TRACKS["python"])

    completed_keys = set()
    for c in completed_modules:
        k = find_topic_key(c, dom)
        if k:
            completed_keys.add(k)

    if current_topic:
        ck = find_topic_key(current_topic, dom)
        if ck:
            completed_keys.add(ck)

    sorted_topics = sorted(active_map.items(), key=lambda item: item[1]['order'])

    for key, data in sorted_topics:
        if key not in completed_keys:
            prereqs_met = all(p in completed_keys for p in data.get('prerequisites', []))
            if prereqs_met:
                return {
                    'key': key,
                    'title': data['title'],
                    'description': data['description'],
                    'order': data['order'],
                    'domain': dom
                }

    last_key, last_data = sorted_topics[-1]
    return {
        'key': last_key,
        'title': last_data['title'],
        'description': last_data['description'],
        'order': last_data['order'],
        'domain': dom,
        'all_completed': True,
    }

def advance_student_model(
    profile: Any,
    score: int,
    detected_weak_topics: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Domain-aware student advancement:
    - Only attributes weaknesses within the active domain
    - Advances student to the next topic in the same domain roadmap
    """
    current_topic = getattr(profile, 'target_topic', 'Python Basics & Syntax')
    dom = detect_domain(current_topic)
    active_map = DOMAIN_TRACKS.get(dom, DOMAIN_TRACKS["python"])

    curr_key = find_topic_key(current_topic, dom) or list(active_map.keys())[0]
    curr_title = active_map.get(curr_key, {}).get('title', current_topic)

    passed = score >= 2

    completed = list(getattr(profile, 'completed_modules', []))
    weak = list(getattr(profile, 'weak_topics', []))

    if detected_weak_topics:
        for w in detected_weak_topics:
            if w and w not in weak:
                weak.append(w)

    if passed:
        if curr_title not in completed:
            completed.append(curr_title)
        weak = [w for w in weak if find_topic_key(w, dom) != curr_key]
        current_level = int(getattr(profile, 'skill_level', 1))
        new_level = min(current_level + 1, 5)

        next_topic_info = get_next_topic(completed, curr_title, domain=dom)
        next_topic_title = next_topic_info['title']

        new_state = 'TEACHING'
        message = (
            f"Mastered '{curr_title}' in {dom.upper()} track with score {score}/3! "
            f"Promoted to Skill Level {new_level}/5. "
            f"Next Goal: '{next_topic_title}'."
        )
    else:
        new_level = int(getattr(profile, 'skill_level', 1))
        if curr_title not in weak:
            weak.append(curr_title)
        next_topic_title = curr_title
        new_state = 'REMEDIATING'
        message = (
            f"Score {score}/3 on '{curr_title}'. Strengthening foundational concepts in {dom.upper()} track."
        )

    profile.target_topic = next_topic_title
    profile.skill_level = new_level
    profile.completed_modules = completed
    profile.weak_topics = weak
    if hasattr(profile, 'current_state'):
        profile.current_state = new_state

    return {
        'passed': passed,
        'score': score,
        'domain': dom,
        'previous_topic': curr_title,
        'current_topic': next_topic_title,
        'skill_level': new_level,
        'current_state': new_state,
        'completed_modules': completed,
        'weak_topics': weak,
        'message': message,
    }
