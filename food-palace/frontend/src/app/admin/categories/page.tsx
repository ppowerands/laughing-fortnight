'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: () => categoriesApi.getAllAdmin().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editCat ? categoriesApi.update(editCat.id, data) : categoriesApi.create(data),
    onSuccess: () => {
      toast.success(editCat ? 'Category updated!' : 'Category created!');
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      close();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { toast.success('Category deleted'); queryClient.invalidateQueries({ queryKey: ['categories-admin'] }); },
    onError: () => toast.error('Cannot delete category with existing products'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => categoriesApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories-admin'] }),
  });

  const open = (cat?: any) => { setEditCat(cat || null); setForm({ name: cat?.name || '', description: cat?.description || '' }); setShowModal(true); };
  const close = () => { setShowModal(false); setEditCat(null); setForm({ name: '', description: '' }); };

  const categoryEmojis: Record<string, string> = {
    'main-meals': '🍛', 'burgers-shawarma': '🌯', 'soups-swallow': '🍲',
    'sides': '🍟', 'drinks': '🥤', 'desserts': '🍦',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => open()} className="btn-primary !py-2 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />) : (
          categories.map((cat: any) => (
            <div key={cat.id} className={`card p-5 ${!cat.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{categoryEmojis[cat.slug] || '🍽️'}</div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive })}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${cat.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => open(cat)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this category? This cannot be undone.')) deleteMutation.mutate(cat.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{cat.name}</h3>
              {cat.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</p>}
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">{cat._count?.products || 0} products</p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editCat ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" placeholder="e.g. Main Meals" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Short description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 btn-primary text-sm">
                  {saveMutation.isPending ? 'Saving...' : (editCat ? 'Save Changes' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
