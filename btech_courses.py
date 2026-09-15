from typing import Dict, Any, List

BTECH_BRANCHES: List[Dict[str, str]] = [
    {"id": "all", "name": "All B.Tech Courses", "icon": "🎓"},
    {"id": "cse_it", "name": "Computer Science & IT (CSE/IT)", "icon": "💻"},
    {"id": "ai_ds", "name": "AI & Data Science (AI/DS)", "icon": "🤖"},
    {"id": "ece_eee", "name": "Electronics & Electrical (ECE/EEE)", "icon": "⚡"},
    {"id": "mech_civil", "name": "Mechanical & Civil (ME/CE)", "icon": "⚙️"},
    {"id": "first_year", "name": "1st Year Core Foundation", "icon": "📐"},
]

BTECH_COURSES: Dict[str, Dict[str, Any]] = {
    # -------------------------------------------------------------
    # 1. Computer Science & IT (CSE / IT)
    # -------------------------------------------------------------
    "dsa": {
        "name": "Data Structures & Algorithms (DSA)",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "🏆",
        "semester": "Semester 3",
        "default_topic": "Arrays & Two-Pointer Techniques",
        "topics": {
            "arrays_and_pointers": {"title": "Arrays & Two-Pointer Techniques", "order": 1, "description": "Array operations, two pointers, sliding window, and prefix sums."},
            "linked_lists": {"title": "Linked Lists & Fast-Slow Pointers", "order": 2, "description": "Singly/doubly linked lists, cycle detection, and list reversals."},
            "stacks_and_queues": {"title": "Stacks, Queues & Monotonic Stacks", "order": 3, "description": "LIFO/FIFO, balanced parentheses, and next greater element."},
            "trees_and_bst": {"title": "Binary Trees & Binary Search Trees", "order": 4, "description": "Tree traversals (DFS/BFS), height, balance, and LCA."},
            "heaps_and_hashing": {"title": "Hash Tables & Priority Queues (Heaps)", "order": 5, "description": "Collision resolution, min/max heaps, and top-K elements."},
            "dynamic_programming": {"title": "Dynamic Programming (1D & 2D)", "order": 6, "description": "Memoization, tabulation, knapsack, and longest common subsequence."},
            "graph_algorithms": {"title": "Graph Algorithms (BFS, DFS, Dijkstra)", "order": 7, "description": "Adjacency lists, topological sort, shortest paths, and MST."},
        }
    },
    "os": {
        "name": "Operating Systems (OS)",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "💻",
        "semester": "Semester 4",
        "default_topic": "Processes, Threads & System Calls",
        "topics": {
            "process_management": {"title": "Processes, Threads & System Calls", "order": 1, "description": "Process state diagram, PCB, user vs kernel mode, context switching, and POSIX fork/exec."},
            "cpu_scheduling": {"title": "CPU Scheduling Algorithms", "order": 2, "description": "FCFS, SJF, Priority, Round Robin scheduling, and multi-level feedback queues."},
            "concurrency_deadlocks": {"title": "Process Synchronization & Deadlocks", "order": 3, "description": "Critical section problem, semaphores, mutexes, Banker's algorithm, and deadlock prevention."},
            "memory_management": {"title": "Memory Management & Paging", "order": 4, "description": "Contiguous allocation, paging, segmentation, TLB, and address translation."},
            "virtual_memory": {"title": "Virtual Memory & Page Replacement", "order": 5, "description": "Demand paging, page faults, FIFO, LRU, Optimal page replacement, and thrashing."},
            "file_systems_io": {"title": "File Systems & Disk Scheduling", "order": 6, "description": "Inodes, file allocation methods (indexed, contiguous), SSTF, SCAN, and C-SCAN."},
        }
    },
    "dbms": {
        "name": "Database Management Systems (DBMS)",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "💾",
        "semester": "Semester 4",
        "default_topic": "Relational Model & SQL Queries",
        "topics": {
            "relational_model": {"title": "Relational Model & SQL Queries", "order": 1, "description": "DDL, DML, relational algebra, constraints, complex JOINs, and aggregate functions."},
            "normalization": {"title": "Database Normalization (1NF to BCNF)", "order": 2, "description": "Functional dependencies, candidate keys, 1NF, 2NF, 3NF, BCNF, and loss-less decompositions."},
            "transactions_acid": {"title": "Transactions & ACID Properties", "order": 3, "description": "Atomicity, consistency, isolation, durability, schedule serializability, and conflicts."},
            "concurrency_control": {"title": "Concurrency Control & Locking", "order": 4, "description": "Two-Phase Locking (2PL), deadlocks in databases, and timestamp ordering protocols."},
            "indexing_b_trees": {"title": "Indexing, B-Trees & Query Optimization", "order": 5, "description": "B-Tree and B+ Tree index structures, hash indexing, and query evaluation plans."},
        }
    },
    "cn": {
        "name": "Computer Networks (CN)",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "🌐",
        "semester": "Semester 5",
        "default_topic": "Network Models: OSI & TCP/IP Stack",
        "topics": {
            "network_models": {"title": "Network Models: OSI & TCP/IP Stack", "order": 1, "description": "Layered architectures, encapsulation, framing, error detection (CRC), and MAC addressing."},
            "data_link_layer": {"title": "Data Link Layer & MAC Protocols", "order": 2, "description": "Sliding window protocols (Go-Back-N, Selective Repeat), CSMA/CD, and Ethernet switching."},
            "network_layer_routing": {"title": "Network Layer: IP Addressing & Routing", "order": 3, "description": "IPv4/IPv6 subnetting, CIDR, Distance Vector (RIP), Link State (OSPF), and BGP."},
            "transport_layer": {"title": "Transport Layer: TCP & UDP", "order": 4, "description": "Three-way handshake, flow control (sliding window), TCP congestion control (AIMD), and UDP sockets."},
            "application_layer": {"title": "Application Layer: DNS, HTTP & Security", "order": 5, "description": "DNS hierarchy, HTTP/1.1 vs HTTP/2, TLS/SSL handshake, and socket programming."},
        }
    },
    "java": {
        "name": "Java Enterprise & Core Internals",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "☕",
        "semester": "Semester 3",
        "default_topic": "Java Basics & Primitive Types",
        "topics": {
            "java_basics": {"title": "Java Basics & Primitive Types", "order": 1, "description": "JVM architecture, primitive types, bytecode, and basic operators."},
            "java_control_flow": {"title": "Control Flow & Methods", "order": 2, "description": "Conditionals, switch expressions, loops, and method signatures."},
            "oop_fundamentals": {"title": "OOP: Classes, Objects & Encapsulation", "order": 3, "description": "Constructors, access modifiers, getters/setters, and object lifecycle."},
            "string_pool_memory": {"title": "String Pool, Immutability & Memory", "order": 4, "description": "String literals vs new String(), heap vs stack, and == vs .equals()."},
            "exception_handling": {"title": "Exceptions & Try-With-Resources", "order": 5, "description": "Checked vs unchecked exceptions, AutoCloseable, and try-with-resources."},
            "collections_framework": {"title": "Collections Framework (ArrayList, HashMap)", "order": 6, "description": "List vs Set vs Map, internal hashing in HashMap, and ArrayList resizing."},
            "generics": {"title": "Java Generics & Type Erasure", "order": 7, "description": "Type parameters, bounded wildcards (? extends T), and runtime type erasure."},
            "concurrency": {"title": "Java Concurrency & Multithreading", "order": 8, "description": "Threads, synchronization, volatile, ExecutorService, and thread safety."},
        }
    },
    "python": {
        "name": "Python Mastery & Advanced Patterns",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "🐍",
        "semester": "Semester 3",
        "default_topic": "Python Basics & Syntax",
        "topics": {
            "python_basics": {"title": "Python Basics & Syntax", "order": 1, "description": "Variables, basic data types (int, float, str, bool), and fundamental operators."},
            "control_flow": {"title": "Control Flow & Loops", "order": 2, "description": "If/else conditionals, for loops, while loops, and loop control statements."},
            "data_structures": {"title": "Data Structures (Lists, Dicts, Sets)", "order": 3, "description": "Lists, dictionaries, tuples, sets, hashing, and dictionary key collision resolution."},
            "functions_and_scope": {"title": "Functions & Scope", "order": 4, "description": "Function definitions, args/kwargs, return values, default arguments, and LEGB scope."},
            "oop_python": {"title": "Object-Oriented Python", "order": 5, "description": "Classes, dunder methods (__init__, __repr__), inheritance, and polymorphism."},
            "decorators_and_generators": {"title": "Decorators & Generators", "order": 6, "description": "Higher-order functions, closures, decorators with arguments, and yield expressions."},
        }
    },
    "web_tech": {
        "name": "Full-Stack Web Technologies",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "🌐",
        "semester": "Semester 5",
        "default_topic": "Modern JavaScript ES6+ & Event Loop",
        "topics": {
            "js_fundamentals": {"title": "Modern JavaScript ES6+ & Event Loop", "order": 1, "description": "Closures, prototypes, promises, async/await, event loop, and call stack execution."},
            "react_architecture": {"title": "React Architecture, Hooks & Virtual DOM", "order": 2, "description": "Virtual DOM, useState/useEffect/useMemo, component lifecycle, and state flow."},
            "backend_apis": {"title": "Node.js, Express & RESTful APIs", "order": 3, "description": "Middleware pipelines, routing, JWT authentication, CORS, and database connectors."},
            "fullstack_deployment": {"title": "Next.js, Server Components & Deployment", "order": 4, "description": "SSR vs SSG, Server Actions, API routes, and cloud deployment pipelines."},
        }
    },
    "toc_compiler": {
        "name": "Theory of Computation & Compiler Design",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "⚙️",
        "semester": "Semester 6",
        "default_topic": "Finite Automata & Regular Expressions",
        "topics": {
            "finite_automata": {"title": "Finite Automata & Regular Expressions", "order": 1, "description": "DFA, NFA, NFA to DFA conversion, minimization of DFA, and pumping lemma."},
            "context_free_grammars": {"title": "Context-Free Grammars & Pushdown Automata", "order": 2, "description": "CFG, parse trees, ambiguity, Chomsky Normal Form (CNF), and PDA design."},
            "turing_machines": {"title": "Turing Machines & Decidability", "order": 3, "description": "Turing machine models, Halting problem, undecidability, and Chomsky hierarchy."},
            "lexical_syntax_analysis": {"title": "Lexical Analysis & Parsing Techniques", "order": 4, "description": "Lex tokens, LL(1) parsing, LR(0), SLR(1), LALR, and shift-reduce conflicts."},
            "code_generation_opt": {"title": "Intermediate Code Generation & Optimization", "order": 5, "description": "Three-address code, syntax-directed translation, DAG, and basic block optimization."},
        }
    },
    "cybersecurity": {
        "name": "Cybersecurity & Ethical Hacking",
        "branch": "cse_it",
        "branch_name": "Computer Science & IT",
        "icon": "🛡️",
        "semester": "Semester 6",
        "default_topic": "Networking Protocols & Packet Analysis",
        "topics": {
            "network_security": {"title": "Networking Protocols & Packet Analysis", "order": 1, "description": "TCP/IP three-way handshake, DNS, HTTP/HTTPS, SSL/TLS, and Wireshark inspection."},
            "cryptography": {"title": "Applied Cryptography & PKI", "order": 2, "description": "AES, RSA, SHA-256 hashing, digital signatures, and public key certificates."},
            "owasp_web_security": {"title": "Web Application Security (OWASP Top 10)", "order": 3, "description": "SQL injection, Cross-Site Scripting (XSS), CSRF, SSRF, and session fixation."},
            "network_defense": {"title": "Network Defense & Penetration Testing", "order": 4, "description": "Port scanning with Nmap, IDS/IPS, firewalls, threat modeling, and Zero Trust."},
        }
    },

    # -------------------------------------------------------------
    # 2. Artificial Intelligence & Data Science (AI & DS)
    # -------------------------------------------------------------
    "ml": {
        "name": "Machine Learning (ML)",
        "branch": "ai_ds",
        "branch_name": "AI & Data Science",
        "icon": "🤖",
        "semester": "Semester 5",
        "default_topic": "Data Preprocessing with NumPy & Pandas",
        "topics": {
            "data_engineering": {"title": "Data Preprocessing with NumPy & Pandas", "order": 1, "description": "Vectorized computations, matrix operations, feature encoding, and normalization."},
            "supervised_learning": {"title": "Supervised Learning: Regression & Classification", "order": 2, "description": "Linear regression, gradient descent, logistic regression, SVMs, and decision trees."},
            "ensemble_learning": {"title": "Ensemble Methods: Random Forests & Boosting", "order": 3, "description": "Bagging vs boosting, Random Forests, AdaBoost, XGBoost, and hyperparameter tuning."},
            "unsupervised_learning": {"title": "Unsupervised Learning & Dimensionality Reduction", "order": 4, "description": "K-Means clustering, hierarchical clustering, PCA (Principal Component Analysis)."},
            "model_evaluation": {"title": "Model Evaluation & Bias-Variance Tradeoff", "order": 5, "description": "Confusion matrix, ROC-AUC, precision/recall, k-fold cross-validation, and regularization."},
        }
    },
    "dl": {
        "name": "Deep Learning & Neural Networks",
        "branch": "ai_ds",
        "branch_name": "AI & Data Science",
        "icon": "🧠",
        "semester": "Semester 6",
        "default_topic": "Perceptrons & Feedforward Neural Networks",
        "topics": {
            "fnn_and_backprop": {"title": "Perceptrons & Feedforward Neural Networks", "order": 1, "description": "Activation functions (ReLU, Sigmoid), forward pass, backpropagation, and loss functions."},
            "optimization_techniques": {"title": "Deep Learning Optimization & Regularization", "order": 2, "description": "SGD, Momentum, Adam optimizer, dropout, batch normalization, and vanishing gradients."},
            "cnn_architecture": {"title": "Convolutional Neural Networks (CNNs)", "order": 3, "description": "Convolution layers, pooling, feature maps, ResNet architectures, and image classification."},
            "rnn_and_transformers": {"title": "Recurrent Networks (RNN, LSTM) & Transformers", "order": 4, "description": "Sequential data, vanishing gradients in RNNs, LSTM gates, and self-attention intuition."},
        }
    },
    "rag_ai": {
        "name": "RAG & Generative AI Systems",
        "branch": "ai_ds",
        "branch_name": "AI & Data Science",
        "icon": "✨",
        "semester": "Semester 7",
        "default_topic": "Embeddings & Vector Spaces",
        "topics": {
            "embeddings": {"title": "Embeddings & Vector Spaces", "order": 1, "description": "Converting text into dense numerical vectors, cosine similarity, and semantic similarity."},
            "chunking_and_preprocessing": {"title": "Document Chunking & Preprocessing", "order": 2, "description": "Splitting documents into chunks, chunk overlap, token limits, and text cleanup."},
            "vector_databases": {"title": "Vector Databases & ANN Search", "order": 3, "description": "Indexing embedding vectors in ChromaDB/Pinecone, approximate nearest neighbors (ANN)."},
            "rag": {"title": "Retrieval-Augmented Generation (RAG)", "order": 4, "description": "Augmenting LLM prompts with relevant retrieved knowledge chunks for grounded answers."},
            "agentic_ai": {"title": "Agentic AI & Tool Calling", "order": 5, "description": "Autonomous agents, ReAct loops, tool/function calling, memory, and multi-agent coordination."},
            "evaluation_and_reflection": {"title": "Evaluation, Guardrails & Self-Correction", "order": 6, "description": "Automated evaluation of agent outputs, factual verification, guardrails, and self-reflection."},
        }
    },

    # -------------------------------------------------------------
    # 3. Electronics & Electrical Engineering (ECE / EEE)
    # -------------------------------------------------------------
    "digital_logic": {
        "name": "Digital Logic Design (DLD)",
        "branch": "ece_eee",
        "branch_name": "Electronics & Electrical",
        "icon": "⚡",
        "semester": "Semester 3",
        "default_topic": "Boolean Algebra & Logic Gates",
        "topics": {
            "boolean_algebra": {"title": "Boolean Algebra & Logic Gates", "order": 1, "description": "Number systems, 2's complement, De Morgan's laws, and standard logic gates."},
            "k_maps": {"title": "Karnaugh Maps (K-Maps) & Minimization", "order": 2, "description": "2, 3, and 4-variable K-Maps, don't care conditions, and SOP/POS simplification."},
            "combinational_circuits": {"title": "Combinational Circuits (Adders, MUX, Decoders)", "order": 3, "description": "Half/full adders, ripple carry adders, multiplexers, demultiplexers, and encoders."},
            "sequential_circuits": {"title": "Sequential Circuits: Flip-Flops & Registers", "order": 4, "description": "SR, D, JK, T flip-flops, race-around condition, shift registers, and synchronous counters."},
            "fsm_design": {"title": "Finite State Machines (Mealy & Moore)", "order": 5, "description": "State tables, state diagrams, state reduction, and Verilog HDL module design."},
        }
    },
    "signals_systems": {
        "name": "Signals and Systems & DSP",
        "branch": "ece_eee",
        "branch_name": "Electronics & Electrical",
        "icon": "📡",
        "semester": "Semester 4",
        "default_topic": "Continuous vs Discrete-Time Signals",
        "topics": {
            "signal_classification": {"title": "Continuous vs Discrete-Time Signals", "order": 1, "description": "Periodic, energy, power signals, impulse function, unit step, and time transformations."},
            "lti_systems": {"title": "Linear Time-Invariant (LTI) Systems & Convolution", "order": 2, "description": "Linearity, time-invariance, causality, stability, and continuous/discrete convolution."},
            "fourier_series": {"title": "Fourier Series & Fourier Transform (CTFT/DTFT)", "order": 3, "description": "Trigonometric and exponential Fourier series, Fourier Transform pairs, and frequency spectra."},
            "laplace_transform": {"title": "Laplace Transform & Transfer Functions", "order": 4, "description": "Region of Convergence (ROC), unilateral Laplace transform, poles, zeros, and stability."},
            "z_transform": {"title": "Z-Transform & Digital Filter Basics", "order": 5, "description": "Z-plane ROC, inverse Z-transform, difference equations, and FIR/IIR digital filter design."},
        }
    },
    "microprocessors": {
        "name": "Microprocessors & Embedded Systems",
        "branch": "ece_eee",
        "branch_name": "Electronics & Electrical",
        "icon": "🔲",
        "semester": "Semester 5",
        "default_topic": "8086 Microprocessor Architecture",
        "topics": {
            "arch_8086": {"title": "8086 Microprocessor Architecture", "order": 1, "description": "Internal architecture, EU and BIU, register organization, and memory segmentation."},
            "assembly_programming": {"title": "Assembly Language & Addressing Modes", "order": 2, "description": "Immediate, register, direct, indirect addressing, and assembly instruction sets."},
            "interrupts_interfacing": {"title": "Interrupts & Peripheral Interfacing (8255, 8259)", "order": 3, "description": "Hardware and software interrupts, interrupt vector table, and programmable peripheral interfaces."},
            "arm_and_embedded": {"title": "ARM Cortex Architecture & Embedded C", "order": 4, "description": "RISC vs CISC, ARM registers, GPIO programming, timers, and embedded microcontroller basics."},
        }
    },
    "circuits_eee": {
        "name": "Electric Circuit Analysis & Network Theory",
        "branch": "ece_eee",
        "branch_name": "Electronics & Electrical",
        "icon": "🔌",
        "semester": "Semester 3",
        "default_topic": "DC Circuit Laws: KCL & KVL",
        "topics": {
            "kcl_kvl": {"title": "DC Circuit Laws: KCL & KVL", "order": 1, "description": "Kirchhoff's Current and Voltage Laws, node voltage, and mesh current analysis."},
            "network_theorems": {"title": "Network Theorems (Thevenin, Norton, Superposition)", "order": 2, "description": "Thevenin's theorem, Norton's equivalent, Maximum Power Transfer, and Superposition."},
            "ac_circuits": {"title": "Sinusoidal Steady-State & AC Phasors", "order": 3, "description": "Phasor representations, impedance, admittance, power factor, and resonance (series & parallel)."},
            "transient_analysis": {"title": "Transient Analysis in RL, RC & RLC Circuits", "order": 4, "description": "First-order differential response, step response, damping ratio, and Laplace circuit models."},
        }
    },

    # -------------------------------------------------------------
    # 4. Mechanical & Civil Engineering (ME / CE)
    # -------------------------------------------------------------
    "eng_mechanics": {
        "name": "Strength of Materials (SOM)",
        "branch": "mech_civil",
        "branch_name": "Mechanical & Civil",
        "icon": "⚙️",
        "semester": "Semester 3",
        "default_topic": "Simple Stresses, Strains & Elastic Constants",
        "topics": {
            "stress_strain": {"title": "Simple Stresses, Strains & Elastic Constants", "order": 1, "description": "Tensile, compressive, shear stress, Hooke's law, Young's modulus, Poisson's ratio."},
            "sfd_bmd": {"title": "Shear Force & Bending Moment Diagrams (SFD/BMD)", "order": 2, "description": "Beams (cantilever, simply supported), point loads, UDL, and point of contraflexure."},
            "bending_stresses": {"title": "Theory of Simple Bending & Flexural Stresses", "order": 3, "description": "Flexure formula (M/I = sigma/y = E/R), section modulus, and beam deflection."},
            "torsion_shafts": {"title": "Torsion in Circular Shafts & Springs", "order": 4, "description": "Torsion equation (T/J = tau/r = G*theta/L), polar moment of inertia, and shear stress."},
        }
    },
    "thermodynamics": {
        "name": "Thermodynamics & Heat Transfer",
        "branch": "mech_civil",
        "branch_name": "Mechanical & Civil",
        "icon": "🔥",
        "semester": "Semester 3",
        "default_topic": "First Law of Thermodynamics & Systems",
        "topics": {
            "first_law": {"title": "First Law of Thermodynamics & Systems", "order": 1, "description": "Closed and open systems, internal energy, enthalpy, heat, work, and steady flow energy equation."},
            "second_law": {"title": "Second Law of Thermodynamics & Entropy", "order": 2, "description": "Kelvin-Planck, Clausius statements, Carnot cycle, heat engines, and entropy principle."},
            "steam_and_cycles": {"title": "Vapor Power Cycles (Rankine & Otto/Diesel)", "order": 3, "description": "Pure substances, Mollier diagram, Rankine cycle efficiency, and internal combustion cycles."},
            "heat_conduction": {"title": "Modes of Heat Transfer: Conduction, Convection & Radiation", "order": 4, "description": "Fourier's law of conduction, Newton's law of cooling, Stefan-Boltzmann law, and heat exchangers."},
        }
    },
    "fluid_mechanics": {
        "name": "Fluid Mechanics & Hydraulics",
        "branch": "mech_civil",
        "branch_name": "Mechanical & Civil",
        "icon": "💧",
        "semester": "Semester 4",
        "default_topic": "Fluid Properties & Hydrostatic Pressure",
        "topics": {
            "fluid_properties": {"title": "Fluid Properties & Hydrostatic Pressure", "order": 1, "description": "Viscosity, density, surface tension, Pascal's law, manometers, and buoyant force."},
            "fluid_kinematics": {"title": "Fluid Kinematics: Continuity & Velocity Potential", "order": 2, "description": "Streamlines, pathlines, velocity potential, stream function, and 3D continuity equation."},
            "bernoulli_dynamics": {"title": "Fluid Dynamics & Bernoulli's Equation", "order": 3, "description": "Euler's equation of motion, Bernoulli's theorem applications (Venturimeter, Pitot tube)."},
            "viscous_pipe_flow": {"title": "Viscous Flow in Pipes & Boundary Layers", "order": 4, "description": "Laminar vs turbulent flow, Reynolds number, Hagen-Poiseuille equation, and Darcy friction factor."},
        }
    },
    "structural_analysis": {
        "name": "Structural Analysis & RCC Design",
        "branch": "mech_civil",
        "branch_name": "Mechanical & Civil",
        "icon": "🏗️",
        "semester": "Semester 5",
        "default_topic": "Analysis of Determinate & Indeterminate Trusses",
        "topics": {
            "truss_analysis": {"title": "Analysis of Determinate & Indeterminate Trusses", "order": 1, "description": "Method of joints, method of sections, static determinacy, and deflection of pin-jointed frames."},
            "slope_deflection": {"title": "Slope Deflection & Moment Distribution Methods", "order": 2, "description": "Fixed end moments, slope-deflection equations, continuous beam analysis, and sway frames."},
            "rcc_fundamentals": {"title": "RCC Design Principles: Limit State Method", "order": 3, "description": "Working stress vs limit state design, stress-strain curves for steel and concrete, Singly reinforced beams."},
            "rcc_columns_slabs": {"title": "Design of RCC Slabs & Short Columns", "order": 4, "description": "One-way and two-way slab design, axial load with uniaxial/biaxial bending in columns."},
        }
    },

    # -------------------------------------------------------------
    # 5. 1st Year Core Foundation (All B.Tech Branches)
    # -------------------------------------------------------------
    "c_programming": {
        "name": "Programming for Problem Solving (C)",
        "branch": "first_year",
        "branch_name": "1st Year Core",
        "icon": "💻",
        "semester": "Semester 1",
        "default_topic": "C Fundamentals, Data Types & Operators",
        "topics": {
            "c_basics": {"title": "C Fundamentals, Data Types & Operators", "order": 1, "description": "Syntax, tokens, format specifiers, arithmetic, logical, and bitwise operators."},
            "c_control_flow": {"title": "Decision Making & Iterative Loops in C", "order": 2, "description": "If/else, nested switches, for, while, do-while, and break/continue statements."},
            "c_arrays_strings": {"title": "Arrays & String Manipulation in C", "order": 3, "description": "1D/2D arrays, matrix multiplication, null terminator, and string.h library functions."},
            "c_pointers_functions": {"title": "Functions, Pointers & Memory Addresses", "order": 4, "description": "Pass by value vs reference, pointer arithmetic, double pointers, and recursive functions."},
            "c_dma_structures": {"title": "Structures, Unions & Dynamic Memory (DMA)", "order": 5, "description": "User-defined types, malloc(), calloc(), realloc(), free(), and file handling in C."},
        }
    },
    "eng_math_1": {
        "name": "Engineering Mathematics (Calculus & Linear Algebra)",
        "branch": "first_year",
        "branch_name": "1st Year Core",
        "icon": "📐",
        "semester": "Semester 1",
        "default_topic": "Matrices, Rank & Eigenvalues/Eigenvectors",
        "topics": {
            "matrices_eigenvalues": {"title": "Matrices, Rank & Eigenvalues/Eigenvectors", "order": 1, "description": "Echelon form, rank, Cayley-Hamilton theorem, and diagonalizing symmetric matrices."},
            "differential_calculus": {"title": "Differential Calculus: Taylor Series & Partial Derivatives", "order": 2, "description": "Rolle's theorem, Mean Value Theorem, Taylor/Maclaurin series, and Euler's theorem on homogeneous functions."},
            "maxima_minima": {"title": "Multivariable Calculus: Maxima, Minima & Jacobians", "order": 3, "description": "Total derivatives, Jacobians, and finding extrema using Lagrange's multiplier method."},
            "differential_equations": {"title": "First & Higher Order Ordinary Differential Equations", "order": 4, "description": "Exact equations, linear ODEs with constant coefficients, and method of variation of parameters."},
        }
    },
    "eng_physics": {
        "name": "Engineering Physics & Semiconductors",
        "branch": "first_year",
        "branch_name": "1st Year Core",
        "icon": "🔬",
        "semester": "Semester 1",
        "default_topic": "Wave Optics: Interference & Diffraction",
        "topics": {
            "wave_optics": {"title": "Wave Optics: Interference & Diffraction", "order": 1, "description": "Newton's rings, Fraunhofer diffraction, diffraction grating, and resolving power."},
            "lasers_fiber": {"title": "Lasers & Optical Fiber Communication", "order": 2, "description": "Stimulated emission, population inversion, He-Ne laser, total internal reflection, and numerical aperture."},
            "quantum_mechanics": {"title": "Quantum Mechanics: De Broglie & Schrodinger Equation", "order": 3, "description": "Wave-particle duality, Heisenberg uncertainty, and 1D time-independent Schrodinger equation in a box."},
            "semiconductors": {"title": "Semiconductor Physics & Band Theory", "order": 4, "description": "Intrinsic vs extrinsic semiconductors, Fermi level, carrier concentration, and Hall effect."},
        }
    },
    "beee": {
        "name": "Basic Electrical & Electronics (BEEE)",
        "branch": "first_year",
        "branch_name": "1st Year Core",
        "icon": "🔌",
        "semester": "Semester 2",
        "default_topic": "DC Circuits & Network Analysis",
        "topics": {
            "dc_analysis": {"title": "DC Circuits & Network Analysis", "order": 1, "description": "Ohm's law, Kirchhoff's laws, star-delta transformations, and nodal/mesh analysis."},
            "ac_single_phase": {"title": "Single-Phase & Three-Phase AC Circuits", "order": 2, "description": "RMS, average values, power in RL/RC circuits, and 3-phase star/delta relationships."},
            "transformers_motors": {"title": "Transformers & Induction Motor Working", "order": 3, "description": "Principle of single-phase transformer, EMF equation, and 3-phase induction motor rotation."},
            "diodes_transistors": {"title": "Semiconductor Diodes, BJTs & Rectifiers", "order": 4, "description": "PN junction diode, full-wave bridge rectifier, zener diode voltage regulator, and BJT configurations."},
        }
    },
}
