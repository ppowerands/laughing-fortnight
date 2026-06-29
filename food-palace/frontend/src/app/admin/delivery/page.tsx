'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, MapPin, X } from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminDeliveryPage() {
  const [showModal, setShowModal] = useState(false);
  const [editZone, setEditZone] = useState<any>(null);
  const [zoneForm, setZoneForm] = useState({ name: '', deliveryFee: '', estimatedTime: '' });
  const [newArea, setNewArea] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: zones = [], isLoading } = useQuery({ queryKey: ['delivery-zones-admin'], queryFn: () => deliveryApi.getZones().then(r => r.data) });

  const saveZoneMutation = useMutation({
    mutationFn: (data: any) => editZone ? deliveryApi.updateZone(editZone.id, data) : deliveryApi.createZone(data),
    onSuccess: () => { toast.success(editZone ? 'Zone updated!' : 'Zone created!'); queryClient.invalidateQueries({ queryKey: ['delivery-zones-admin'] }); closeModal(); },
    onError: () => toast.error('Failed to save zone'),
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => deliveryApi.deleteZone(id),
    onSuccess: () => { toast.success('Zone deleted'); queryClient.invalidateQueries({ queryKey: ['delivery-zones-admin'] }); },
  });

  const addAreaMutation = useMutation({
    mutationFn: ({ zoneId, name }: { zoneId: string; name: string }) => deliveryApi.addArea(zoneId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-zones-admin'] }),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => deliveryApi.deleteArea(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-zones-admin'] }),
  });

  const openModal = (zone?: any) => { setEditZone(zone || null); setZoneForm({ name: zone?.name || '', deliveryFee: zone?.deliveryFee?.toString() || '', estimatedTime: zone?.estimatedTime || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditZone(null); setZoneForm({ name: '', deliveryFee: '', estimatedTime: '' }); };

  const handleAddArea = (zoneId: string) => {
    const name = newArea[zoneId]?.trim();
    if (!name) return;
    addAreaMutation.mutate({ zoneId, name });
    setNewArea(p => ({ ...p, [zoneId]: '' }));
  };

  const zoneColors = ['bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800', 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800', 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => openModal()} className="btn-primary !py-2 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Zone</button>
      </div>

      {isLoading ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div> : zones.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No delivery zones yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone: any, i: number) => (
            <div key={zone.id} className={`card p-5 border-2 ${zoneColors[i % zoneColors.length]}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{zone.name}</h3>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400">₦{zone.deliveryFee.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Est. {zone.estimatedTime}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(zone)} className="p-1.5 rounded-lg hover:bg-white/50 text-gray-600 dark:text-gray-300 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Delete this zone?')) deleteZoneMutation.mutate(zone.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {zone.areas.map((area: any) => (
                    <span key={area.id} className="inline-flex items-center gap-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5 font-medium">
                      <MapPin className="w-3 h-3 text-gray-400" />{area.name}
                      <button onClick={() => deleteAreaMutation.mutate(area.id)} className="ml-0.5 text-gray-300 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <input value={newArea[zone.id] || ''} onChange={e => setNewArea(p => ({ ...p, [zone.id]: e.target.value }))} onKeyPress={e => e.key === 'Enter' && handleAddArea(zone.id)} placeholder="Add area..." className="flex-1 input !py-1.5 text-xs" />
                <button onClick={() => handleAddArea(zone.id)} className="px-3 py-1.5 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors">Add</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{editZone ? 'Edit Zone' : 'Add Delivery Zone'}</h2>
            <form onSubmit={e => { e.preventDefault(); saveZoneMutation.mutate(zoneForm); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone Name *</label>
                <input value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} required className="input" placeholder="e.g. Zone A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Fee (₦) *</label>
                <input type="number" value={zoneForm.deliveryFee} onChange={e => setZoneForm(f => ({ ...f, deliveryFee: e.target.value }))} required className="input" placeholder="1000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Time *</label>
                <input value={zoneForm.estimatedTime} onChange={e => setZoneForm(f => ({ ...f, estimatedTime: e.target.value }))} required className="input" placeholder="30-45 mins" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saveZoneMutation.isPending} className="flex-1 btn-primary text-sm">{saveZoneMutation.isPending ? 'Saving...' : 'Save Zone'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
