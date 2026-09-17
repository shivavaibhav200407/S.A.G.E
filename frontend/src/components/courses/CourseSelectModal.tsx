import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Check, Layers } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import * as learningService from '../../services/learning';

interface CourseSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse?: (courseName: string, courseId: string) => void;
}

// Complete catalog of branches
const FALLBACK_BRANCHES = [
  { id: 'all', name: 'All Courses', icon: '🎓' },
  { id: 'cse_it', name: 'Computer Science & IT', icon: '💻' },
  { id: 'ai_ds', name: 'AI & Data Science', icon: '🤖' },
  { id: 'ece_eee', name: 'Electronics & Electrical', icon: '⚡' },
  { id: 'mech_civil', name: 'Mechanical & Civil', icon: '⚙️' },
  { id: 'first_year', name: '1st Year Foundation', icon: '📐' },
];

export const CourseSelectModal: React.FC<CourseSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectCourse,
}) => {
  const { activeCourse, setActiveCourse } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [coursesList, setCoursesList] = useState<learningService.CourseItem[]>([]);
  const [tracksData, setTracksData] = useState<Record<string, any>>({});
  const [branchesList, setBranchesList] = useState<any[]>(FALLBACK_BRANCHES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const data = await learningService.fetchCourses();
        if (!isMounted) return;

        if (data.courses_list && Array.isArray(data.courses_list)) {
          setCoursesList(data.courses_list);
        } else if (data.courses && typeof data.courses === 'object') {
          const formatted = Object.entries(data.courses).map(([k, meta]) => ({
            ...meta,
            id: meta?.id || k,
          }));
          setCoursesList(formatted);
        }

        if (data.tracks) {
          setTracksData(data.tracks);
        }

        if (data.branches && Array.isArray(data.branches)) {
          setBranchesList(data.branches);
        }
      } catch (err) {
        console.warn('Using offline course list for modal:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Filter courses based on active branch and search query
  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      const matchesBranch =
        selectedBranch === 'all' ||
        course.branch === selectedBranch ||
        (course.branch === 'all' && selectedBranch === 'first_year');

      if (!matchesBranch) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const name = (course.name || '').toLowerCase();
      const id = (course.id || '').toLowerCase();
      const cat = (course.category || course.branch_name || '').toLowerCase();
      const defTopic = (course.default_topic || '').toLowerCase();

      return (
        name.includes(q) ||
        id.includes(q) ||
        cat.includes(q) ||
        defTopic.includes(q)
      );
    });
  }, [coursesList, selectedBranch, searchQuery]);

  const handleSelect = (course: learningService.CourseItem) => {
    setActiveCourse(course.name, course.default_topic);
    if (onSelectCourse) {
      onSelectCourse(course.name, course.id);
    }
    onClose();
  };

  const getTopicCount = (courseId: string): number => {
    if (tracksData[courseId]) {
      return Object.keys(tracksData[courseId]).length;
    }
    return 5;
  };

  const isCurrentCourse = (course: learningService.CourseItem): boolean => {
    if (!activeCourse) return false;
    const a = activeCourse.toLowerCase();
    const n = (course.name || '').toLowerCase();
    const id = (course.id || '').toLowerCase();
    return a === n || a.includes(n) || n.includes(a) || a === id;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Engineering Curriculum & Course Catalog"
    >
      <div className="space-y-4 max-h-[75vh] flex flex-col">
        {/* Subtitle & Search */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-400">
            Select any of the 25+ accredited B.Tech engineering courses. Your AI tutor, curriculum roadmap, and adaptive quizzes will instantly align with this track.
          </p>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses (e.g. Operating Systems, Java, DBMS, Circuit, Math)..."
              className="w-full bg-slate-900/90 text-white placeholder-slate-500 text-xs rounded-xl border border-slate-700/80 pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Branch Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {branchesList.map((branch) => {
              const isActive = selectedBranch === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{branch.icon}</span>
                  <span>{branch.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {loading && coursesList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading engineering courses catalog...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              No courses found matching &quot;{searchQuery}&quot;. Try a different search term.
            </div>
          ) : (
            filteredCourses.map((course) => {
              const active = isCurrentCourse(course);
              const count = getTopicCount(course.id);

              return (
                <div
                  key={course.id}
                  onClick={() => handleSelect(course)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    active
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl p-2 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                      {course.icon || '📘'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {course.name}
                        </h4>
                        {active && (
                          <Badge variant="accent" size="sm">
                            Active Track
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                        {course.semester && (
                          <span className="text-indigo-400 font-medium">{course.semester}</span>
                        )}
                        {course.category && <span>• {course.category}</span>}
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Layers className="w-3 h-3" />
                          {count} Modules
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-3">
                    {active ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        Select
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Showing {filteredCourses.length} accredited courses</span>
          <span className="text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Autonomous Closed-Loop
          </span>
        </div>
      </div>
    </Modal>
  );
};
