'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task } from '@/lib/types';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Zap,
  Target,
  Clock,
  Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { ru } from 'date-fns/locale';

const HOLIDAYS: {[key: string]: string} = {
  '01-01': 'Новый год',
  '01-07': 'Рождество',
  '02-23': 'День защитника Отечества',
  '03-08': '8 Марта',
  '05-01': 'Первомай',
  '05-09': 'День Победы',
  '06-12': 'День России',
  '11-04': 'День народного единства',
};

const MATRIX_CONFIG = {
  'urgent-important': { name: 'Срочно-важно', color: 'bg-red-500', icon: Zap },
  'urgent-unimportant': { name: 'Срочно-неважно', color: 'bg-orange-500', icon: Clock },
  'unurgent-important': { name: 'Не срочно-важно', color: 'bg-blue-500', icon: Target },
  'unurgent-unimportant': { name: 'Не срочно-неважно', color: 'bg-zinc-500', icon: Coffee },
};

export default function PlannerPage() {
  const { user, profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', matrix: 'urgent-important' as Task['matrix'] });

  useEffect(() => {
    if (!profile?.familyId) return;

    const q = query(
      collection(db, 'planner'),
      where('familyId', '==', profile.familyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, [profile?.familyId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !user || !profile?.familyId) return;

    try {
      await addDoc(collection(db, 'planner'), {
        title: newTask.title.trim(),
        date: format(selectedDate, 'yyyy-MM-dd'),
        matrix: newTask.matrix,
        familyId: profile.familyId,
        createdBy: user.uid,
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewTask({ title: '', matrix: 'urgent-important' });
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-black capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h1>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-secondary rounded-xl">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-secondary rounded-xl">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const dayHolidays = HOLIDAYS[format(day, 'MM-dd')];
          const dayTasks = tasks.filter(t => t.date === formattedDate);
          const isSel = isSameDay(day, selectedDate);
          const isCurrMonth = isSameMonth(day, monthStart);

          return (
            <button
              key={formattedDate}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all border",
                isSel ? "bg-primary border-transparent text-white shadow-lg shadow-primary/20 scale-105 z-10" : "bg-card border-border",
                !isCurrMonth && !isSel ? "opacity-30 border-transparent" : "",
                dayHolidays ? "border-red-500/50" : ""
              )}
            >
              <span className={cn(
                "text-sm font-bold",
                dayHolidays && !isSel ? "text-red-500" : ""
              )}>
                {format(day, 'd')}
              </span>

              {/* Task Dots */}
              <div className="flex gap-0.5 mt-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className={cn(
                      "w-1 h-1 rounded-full",
                      isSel ? "bg-white" : MATRIX_CONFIG[task.matrix].color
                    )}
                  />
                ))}
                {dayTasks.length > 3 && <div className={cn("w-1 h-1 rounded-full", isSel ? "bg-white" : "bg-muted-foreground")} />}
              </div>

              {isToday(day) && !isSel && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMatrix = () => {
    const selectedDateTasks = tasks.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd'));

    return (
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">
            {isToday(selectedDate) ? "Сегодня" : format(selectedDate, 'd MMMM', { locale: ru })}
          </h2>
          <button
            onClick={() => setIsAdding(true)}
            className="p-2 bg-primary text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(Object.entries(MATRIX_CONFIG) as [Task['matrix'], typeof MATRIX_CONFIG['urgent-important']][]).map(([key, config]) => {
            const matrixTasks = selectedDateTasks.filter(t => t.matrix === key);
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <config.icon size={16} className={config.color.replace('bg-', 'text-')} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{config.name}</span>
                </div>
                <div className="space-y-2">
                  {matrixTasks.map(task => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm"
                    >
                      <button
                        onClick={() => updateDoc(doc(db, 'planner', task.id), { completed: !task.completed })}
                        className={cn("transition-colors", task.completed ? "text-primary" : "text-muted-foreground")}
                      >
                        {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      <span className={cn("flex-1 font-bold", task.completed ? "line-through opacity-40" : "")}>{task.title}</span>
                      <button
                        onClick={() => deleteDoc(doc(db, 'planner', task.id))}
                        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {matrixTasks.length === 0 && (
                    <div className="p-4 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground italic opacity-50">
                      Нет задач
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      {renderHeader()}
      <div className="bg-card/50 border border-border p-4 rounded-[32px] shadow-sm">
        {renderDays()}
        {renderCells()}
      </div>
      {renderMatrix()}

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[40px] p-8 border-t border-border"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-6">Новая задача</h2>
              <form onSubmit={handleAddTask} className="space-y-6">
                <input
                  autoFocus
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Что нужно сделать?"
                  className="w-full p-5 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/20 text-xl font-bold transition-all"
                />

                <div className="space-y-3">
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest ml-1">Приоритет (Матрица Эйзенхауэра)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(MATRIX_CONFIG) as [Task['matrix'], typeof MATRIX_CONFIG['urgent-important']][]).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewTask({...newTask, matrix: key})}
                        className={cn(
                          "p-4 rounded-2xl text-left border transition-all",
                          newTask.matrix === key ? `${config.color} border-transparent text-white shadow-lg` : "bg-background border-border text-muted-foreground"
                        )}
                      >
                        <config.icon size={18} className="mb-2" />
                        <p className="text-[10px] font-black uppercase leading-tight">{config.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full p-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  Запланировать на {format(selectedDate, 'd MMMM', { locale: ru })}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
