import React, { useState } from 'react';
import { School, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { ClassGroup } from '../types';

interface ClassManagerProps {
  classes: ClassGroup[];
  activeClassId: string | null;
  onAddClass: (newClass: ClassGroup) => void;
  onUpdateClass: (updatedClass: ClassGroup) => void;
  onDeleteClass: (id: string) => void;
  onSelectClass: (id: string | null) => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({
  classes,
  activeClassId,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onSelectClass
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Form State
  const [className, setClassName] = useState('');
  const [studentList, setStudentList] = useState('');

  const activeClass = classes.find(c => c.id === activeClassId);

  const resetForm = () => {
    setClassName('');
    setStudentList('');
    setIsCreating(false);
    setIsEditing(null);
  };

  const handleStartEdit = (cls: ClassGroup) => {
    setClassName(cls.name);
    setStudentList(cls.students.join('\n'));
    setIsEditing(cls.id);
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!className.trim()) return alert("Vui lòng nhập tên lớp");

    const studentsArray = studentList
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (isEditing) {
      const existing = classes.find(c => c.id === isEditing);
      if (existing) {
        onUpdateClass({
          ...existing,
          name: className,
          students: studentsArray
        });
      }
    } else {
      const newClass: ClassGroup = {
        id: `class-${Date.now()}`,
        name: className,
        students: studentsArray,
        studentScores: [], // Init empty
        teams: [] // Init empty
      };
      onAddClass(newClass);
      // Auto select new class
      onSelectClass(newClass.id);
    }
    resetForm();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* LEFT: Class Selector */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
            <School className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp học đang chọn</span>
            <div className="flex items-center gap-2 mt-1">
                <select 
                    value={activeClassId || ''} 
                    onChange={(e) => onSelectClass(e.target.value || null)}
                    className="font-bold text-slate-800 text-lg bg-transparent outline-none cursor-pointer hover:text-indigo-600 transition-colors truncate max-w-[200px] md:max-w-xs"
                >
                    <option value="">-- Chọn lớp / Mặc định --</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name} ({cls.students.length} HS)</option>
                    ))}
                </select>
                
                {activeClass && (
                    <button 
                        onClick={() => handleStartEdit(activeClass)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Sửa lớp này"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 shrink-0">
            {!isCreating && !isEditing && (
                 <button 
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-md shadow-indigo-200 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Tạo Lớp Mới
                </button>
            )}
        </div>
      </div>

      {/* EDIT/CREATE FORM OVERLAY */}
      {(isCreating || isEditing) && (
          <div className="mt-4 pt-4 border-t border-indigo-50 animate-in slide-in-from-top-2 fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Tên lớp</label>
                          <input 
                              type="text" 
                              value={className}
                              onChange={e => setClassName(e.target.value)}
                              placeholder="Ví dụ: Lớp 5A"
                              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 bg-white"
                          />
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={handleSave}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                          >
                              <Save className="w-4 h-4" /> Lưu
                          </button>
                          <button 
                            onClick={resetForm}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200"
                          >
                              Hủy
                          </button>
                          {isEditing && (
                              <button 
                                onClick={() => {
                                    if (window.confirm("Xóa lớp này? Dữ liệu điểm sẽ mất vĩnh viễn.")) {
                                        onDeleteClass(isEditing);
                                        resetForm();
                                    }
                                }}
                                className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-100"
                                title="Xóa lớp"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                      </div>
                  </div>

                  <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">
                            Danh sách học sinh <span className="font-normal text-slate-400">(Mỗi tên một dòng)</span>
                       </label>
                       <textarea 
                            value={studentList}
                            onChange={e => setStudentList(e.target.value)}
                            placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;..."
                            className="w-full h-32 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none text-slate-900 bg-white"
                       />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ClassManager;