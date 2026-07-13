import React, { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListPriceLists,
  useCreatePriceList,
  useDeletePriceList,
  useListPriceItems,
  useUpdatePriceItem,
  useDeletePriceItem,
  getListPriceListsQueryKey,
  getListPriceItemsQueryKey,
  PriceList,
  PriceItem
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Plus, Trash, Search, FileDown, Database, Building, Calendar, MoreVertical, SearchIcon, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function PriceLists() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: priceLists, isLoading: isLoadingLists } = useListPriceLists();
  const createList = useCreatePriceList();
  const deleteList = useDeletePriceList();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newListData, setNewListData] = React.useState({ name: '', organization: '', year: new Date().getFullYear() });
  const [selectedListId, setSelectedListId] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const { data: items, isLoading: isLoadingItems } = useListPriceItems(
    { priceListId: selectedListId || undefined, q: searchQuery || undefined, limit: 100 },
    { query: { enabled: selectedListId !== null, queryKey: getListPriceItemsQueryKey({ priceListId: selectedListId || undefined, q: searchQuery || undefined, limit: 100 }) } }
  );

  // Default select first list when loaded
  React.useEffect(() => {
    if (priceLists && priceLists.length > 0 && selectedListId === null) {
      setSelectedListId(priceLists[0].id);
    }
  }, [priceLists, selectedListId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListData.name.trim()) return;
    
    await createList.mutateAsync(
      { data: { name: newListData.name, organization: newListData.organization || null, year: newListData.year || null } },
      {
        onSuccess: (newList) => {
          queryClient.invalidateQueries({ queryKey: getListPriceListsQueryKey() });
          setIsCreateOpen(false);
          setNewListData({ name: '', organization: '', year: new Date().getFullYear() });
          setSelectedListId(newList.id);
          toast({ title: 'Liste oluşturuldu', description: `${newList.name} başarıyla oluşturuldu.` });
        }
      }
    );
  };

  const handleDeleteList = async (id: number) => {
    if (!confirm('Bu fiyat listesini ve içindeki tüm pozları silmek istediğinize emin misiniz?')) return;
    await deleteList.mutateAsync(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPriceListsQueryKey() });
          if (selectedListId === id) {
            setSelectedListId(null);
          }
          toast({ title: 'Liste silindi' });
        }
      }
    );
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedListId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/price-lists/${selectedListId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Yükleme başarısız oldu');
      }

      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: getListPriceListsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListPriceItemsQueryKey({ priceListId: selectedListId }) });
      
      toast({ 
        title: 'Dosya yüklendi', 
        description: `${result.added} poz eklendi, ${result.updated} poz güncellendi. ${result.warnings?.length ? `${result.warnings.length} uyarı var.` : ''}` 
      });
    } catch (err) {
      toast({ 
        title: 'Hata', 
        description: 'Dosya yüklenirken bir sorun oluştu.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectedList = priceLists?.find(l => l.id === selectedListId);

  return (
    <div className="flex h-full w-full">
      {/* Sidebar for Lists */}
      <div className="w-80 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            Birim Fiyat Kaynakları
          </h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Fiyat Listesi Ekle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Liste Adı *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="Örn: 2024 ÇŞB İnşaat Birim Fiyatları"
                    value={newListData.name}
                    onChange={(e) => setNewListData({...newListData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org">Kurum</Label>
                  <Input
                    id="org"
                    placeholder="Örn: Çevre ve Şehircilik Bakanlığı"
                    value={newListData.organization}
                    onChange={(e) => setNewListData({...newListData, organization: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Yıl</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newListData.year}
                    onChange={(e) => setNewListData({...newListData, year: parseInt(e.target.value) || new Date().getFullYear()})}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
                  <Button type="submit" disabled={!newListData.name.trim() || createList.isPending}>
                    Oluştur
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingLists ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : priceLists?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Kayıtlı fiyat listesi yok.
            </div>
          ) : (
            priceLists?.map(list => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-colors ${
                  selectedListId === list.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className="font-medium text-sm line-clamp-1">{list.name}</div>
                <div className={`text-xs flex items-center justify-between ${selectedListId === list.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  <span className="flex items-center gap-1"><Building className="w-3 h-3"/> {list.organization || 'Bilinmiyor'}</span>
                  <span>{list.itemCount} poz</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedList ? (
          <>
            <div className="p-6 border-b bg-card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">{selectedList.name}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {selectedList.organization && (
                      <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {selectedList.organization}</span>
                    )}
                    {selectedList.year && (
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {selectedList.year} Yılı</span>
                    )}
                    <span className="flex items-center gap-1.5"><Database className="w-4 h-4" /> {selectedList.itemCount} Kayıtlı Poz</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept=".xlsx,.xls,.pdf" 
                    onChange={handleUploadFile}
                  />
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Yükleniyor...' : 'Veri Yükle (Excel/PDF)'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 cursor-pointer" onClick={() => handleDeleteList(selectedList.id)}>
                        <Trash className="w-4 h-4" />
                        Listeyi Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="relative max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Poz no veya tanım ara..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isLoadingItems ? (
                <div className="text-center py-12 text-muted-foreground">Kalemler yükleniyor...</div>
              ) : items?.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <FileDown className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-1">Bu listede henüz poz bulunmuyor</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Bu fiyat listesine ait Excel veya PDF dosyasını yükleyerek pozları ve birim fiyatları içeri aktarabilirsiniz.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? 'Yükleniyor...' : 'Dosya Yükle'}
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[150px] font-semibold">Poz No</TableHead>
                        <TableHead className="font-semibold">Tanım</TableHead>
                        <TableHead className="w-[100px] font-semibold text-right">Birim</TableHead>
                        <TableHead className="w-[150px] font-semibold text-right">Birim Fiyat</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items?.map((item) => (
                        <PriceItemRow key={item.id} item={item} selectedListId={selectedListId} />
                      ))}
                    </TableBody>
                  </Table>
                  {items && items.length === 100 && (
                    <div className="p-3 text-center text-sm text-muted-foreground border-t bg-slate-50">
                      İlk 100 sonuç gösteriliyor. Daha fazlası için arama yapın.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p>Sol menüden bir liste seçin veya yeni liste oluşturun.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceItemRow({ item, selectedListId }: { item: PriceItem; selectedListId: number | null }) {
  const queryClient = useQueryClient();
  const updateItem = useUpdatePriceItem();
  const deleteItem = useDeletePriceItem();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({
    pozNo: item.pozNo,
    description: item.description,
    unit: item.unit || '',
    unitPrice: item.unitPrice.toString()
  });

  const handleSave = async () => {
    try {
      const parsedPrice = parseFloat(editData.unitPrice.replace(',', '.'));
      if (isNaN(parsedPrice)) throw new Error('Geçersiz fiyat');
      
      await updateItem.mutateAsync({
        id: item.id,
        data: {
          pozNo: editData.pozNo,
          description: editData.description,
          unit: editData.unit || null,
          unitPrice: parsedPrice
        }
      });
      setIsEditing(false);
      if (selectedListId) {
        queryClient.invalidateQueries({ queryKey: getListPriceItemsQueryKey({ priceListId: selectedListId }) });
      }
    } catch (e) {
      // Revert state if failed
      setEditData({
        pozNo: item.pozNo,
        description: item.description,
        unit: item.unit || '',
        unitPrice: item.unitPrice.toString()
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu pozu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteItem.mutateAsync({ id: item.id });
      if (selectedListId) {
        queryClient.invalidateQueries({ queryKey: getListPriceItemsQueryKey({ priceListId: selectedListId }) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isEditing) {
    return (
      <TableRow className="bg-slate-50/50">
        <TableCell>
          <Input value={editData.pozNo} onChange={e => setEditData({...editData, pozNo: e.target.value})} className="h-8 text-sm font-mono" />
        </TableCell>
        <TableCell>
          <Input value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="h-8 text-sm" />
        </TableCell>
        <TableCell>
          <Input value={editData.unit} onChange={e => setEditData({...editData, unit: e.target.value})} className="h-8 text-sm text-right" />
        </TableCell>
        <TableCell>
          <Input value={editData.unitPrice} onChange={e => setEditData({...editData, unitPrice: e.target.value})} className="h-8 text-sm text-right font-mono" />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsEditing(false)}>İptal</Button>
            <Button size="sm" className="h-8" onClick={handleSave} disabled={updateItem.isPending}>Kaydet</Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="hover:bg-slate-50/50 transition-colors group">
      <TableCell className="font-mono text-sm font-medium">{item.pozNo}</TableCell>
      <TableCell className="text-sm max-w-[400px] truncate" title={item.description}>{item.description}</TableCell>
      <TableCell className="text-sm text-right text-muted-foreground">{item.unit || '-'}</TableCell>
      <TableCell className="text-sm text-right font-mono font-medium">
        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.unitPrice)}
      </TableCell>
      <TableCell className="text-right p-0 pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" /> Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
              <Trash className="w-4 h-4 mr-2" /> Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
