'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, X, Layers } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', image: '', hasVariants: false, isFeatured: false });
  const [variants, setVariants] = useState<{ id?: string; name: string; price: string }[]>([]);
  const [addons, setAddons] = useState<{ id?: string; name: string; price: string }[]>([]);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => productsApi.getAll().then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories-all'], queryFn: () => categoriesApi.getAllAdmin().then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      let product;
      if (editProduct) {
        product = await productsApi.update(editProduct.id, data);
        for (const v of variants) {
          if (v.id) await productsApi.updateVariant(v.id, { name: v.name, price: v.price });
          else if (v.name) await productsApi.addVariant(editProduct.id, { name: v.name, price: v.price });
        }
        for (const a of addons) {
          if (!a.id && a.name) await productsApi.addAddon(editProduct.id, { name: a.name, price: a.price });
        }
      } else {
        product = await productsApi.create({ ...data, variants: variants.filter(v => v.name), addons: addons.filter(a => a.name) });
      }
      return product;
    },
    onSuccess: () => { toast.success(editProduct ? 'Product updated!' : 'Product created!'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); closeModal(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { toast.success('Product deleted'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('Cannot delete product with existing orders'),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteVariant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, inStock }: { id: string; inStock: boolean }) => productsApi.toggleStock(id, inStock),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || '', price: p.price.toString(), categoryId: p.categoryId, image: p.image || '', hasVariants: p.hasVariants, isFeatured: p.isFeatured });
    setVariants(p.variants?.map((v: any) => ({ id: v.id, name: v.name, price: v.price.toString() })) || []);
    setAddons(p.addons?.map((a: any) => ({ id: a.id, name: a.name, price: a.price.toString() })) || []);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditProduct(null);
    setForm({ name: '', description: '', price: '', categoryId: '', image: '', hasVariants: false, isFeatured: false });
    setVariants([]); setAddons([]);
  };

  const addVariantRow = () => setVariants(v => [...v, { name: '', price: '' }]);
  const updateVariantRow = (i: number, field: 'name' | 'price', val: string) => setVariants(v => v.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeVariantRow = (i: number) => {
    const variant = variants[i];
    if (variant.id) deleteVariantMutation.mutate(variant.id);
    setVariants(v => v.filter((_, idx) => idx !== i));
  };

  const addAddonRow = () => setAddons(a => [...a, { name: '', price: '' }]);
  const updateAddonRow = (i: number, field: 'name' | 'price', val: string) => setAddons(a => a.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeAddonRow = (i: number) => setAddons(a => a.filter((_, idx) => idx !== i));

  const filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="input pl-9 !py-2 text-sm" />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary !py-2 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Product', 'Category', 'Price', 'Variants', 'Stock', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-4"><div className="skeleton h-10 rounded-xl" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products found</td></tr>
              ) : filtered.map((p: any) => (
                <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover" onError={(e: any) => { e.target.style.display='none'; }} />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl">🍽️</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        {p.isFeatured && <span className="text-xs text-yellow-600">⭐ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{p.category?.name}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₦{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {p.variants?.length > 0 ? <span className="badge bg-purple-100 text-purple-700">{p.variants.length} sizes</span> : <span className="text-gray-400 text-xs">None</span>}
                    {p.addons?.length > 0 && <span className="badge bg-indigo-100 text-indigo-700 ml-1">{p.addons.length} addons</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => stockMutation.mutate({ id: p.id, inStock: !p.inStock })} className={`badge cursor-pointer ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" placeholder="e.g. Jollof Rice" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price (₦) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required className="input" placeholder="2500" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required className="input">
                    <option value="">Select category</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="input" placeholder="https://example.com/image.jpg" />
                {form.image && (
                  <div className="mt-2">
                    <img src={form.image} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" onError={(e: any) => { e.target.style.display='none'; }} />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Paste a direct image URL (JPG, PNG, WebP)</p>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hasVariants} onChange={e => setForm(f => ({ ...f, hasVariants: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Has Size Variants</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
                </label>
              </div>

              {form.hasVariants && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Size Variants
                    </label>
                    <button type="button" onClick={addVariantRow} className="text-xs text-blue-700 font-semibold hover:underline">+ Add Size</button>
                  </div>
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={v.name} onChange={e => updateVariantRow(i, 'name', e.target.value)} placeholder="e.g. Small" className="input !py-1.5 text-sm flex-1" />
                        <input type="number" value={v.price} onChange={e => updateVariantRow(i, 'price', e.target.value)} placeholder="Price" className="input !py-1.5 text-sm w-24" min="0" />
                        <button type="button" onClick={() => removeVariantRow(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {variants.length === 0 && <p className="text-xs text-gray-400">Click "+ Add Size" to create variants.</p>}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extras & Add-ons</label>
                  <button type="button" onClick={addAddonRow} className="text-xs text-blue-700 font-semibold hover:underline">+ Add Extra</button>
                </div>
                <div className="space-y-2">
                  {addons.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={a.name} onChange={e => updateAddonRow(i, 'name', e.target.value)} placeholder="e.g. Extra Cheese" className="input !py-1.5 text-sm flex-1" disabled={!!a.id} />
                      <input type="number" value={a.price} onChange={e => updateAddonRow(i, 'price', e.target.value)} placeholder="Price" className="input !py-1.5 text-sm w-24" disabled={!!a.id} min="0" />
                      <button type="button" onClick={() => removeAddonRow(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {addons.length === 0 && <p className="text-xs text-gray-400">No add-ons yet.</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {saveMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editProduct ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
