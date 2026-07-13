import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useGetTenderProject, 
  useListTenderItems, 
  useMatchTenderProject,
  useUpdateTenderItem,
  useListPriceLists,
  getGetTenderProjectQueryKey,
  getListTenderItemsQueryKey,
  TenderItem,
  PriceList
} from '@workspace/api-client-react';
import { MatchStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, PlayCircle, FileSpreadsheet, ArrowLeft, Loader2, Save, Link2 } from 'lucide-react';
import { Link } from 'wouter';

export function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: project, isLoading: isProjectLoading } = useGetTenderProject(projectId);
  const { data: items, isLoading: isItemsLoading } = useListTenderItems(projectId);
  const { data: priceLists } = useListPriceLists();
  
  const matchProject = useMatchTenderProject();
  const updateItem = useUpdateTenderItem();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [selectedPriceLists, setSelectedPriceLists] = useState<number[]>([]);
  
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/tender-projects/${projectId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Yükleme başarısız oldu');
      }

      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: getGetTenderProjectQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getListTenderItemsQueryKey(projectId) });
      
      toast({ 
        title: 'Teklif Cetveli Yüklendi', 
        description: `${result.items?.length || 0} poz aktarıldı. ${result.warnings?.length ? `${result.warnings.length} uyarı var.` : ''}` 
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

  const handleMatch = async () => {
    await matchProject.mutateAsync(
      { 
        id: projectId, 
        data: { 
          priceListIds: selectedPriceLists.length > 0 ? selectedPriceLists : null 
        } 
      },
      {
        onSuccess: (updatedItems) => {
          queryClient.invalidateQueries({ queryKey: getGetTenderProjectQueryKey(projectId) });
          queryClient.setQueryData(getListTenderItemsQueryKey(projectId), updatedItems);
          setIsMatchDialogOpen(false);
          toast({ title: 'Eşleştirme Tamamlandı', description: 'Pozlar fiyat listeleriyle eşleştirildi.' });
        },
        onError: () => {
          toast({ title: 'Hata', description: 'Eşleştirme sırasında bir sorun oluştu.', variant: 'destructive' });
        }
      }
    );
  };

  const handleExport = () => {
    window.location.href = `${import.meta.env.BASE_URL}api/tender-projects/${projectId}/export`;
  };

  if (isProjectLoading) {
    return <div className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Proje yükleniyor...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-destructive">Proje bulunamadı.</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4 flex-none">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              {project.fileName ? (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {project.fileName}
                </>
              ) : (
                'Henüz dosya yüklenmedi'
              )}
            </p>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            {items && items.length > 0 && (
              <>
                <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                      <PlayCircle className="w-4 h-4" />
                      Otomatik Eşleştir
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Birim Fiyat Eşleştirme</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Hangi fiyat listelerinin kullanılacağını seçin. Seçim yapmazsanız tüm listelerde arama yapılır.
                      </p>
                      <div className="space-y-3 border rounded-md p-4 max-h-[300px] overflow-y-auto">
                        {priceLists?.map(list => (
                          <div key={list.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`list-${list.id}`} 
                              checked={selectedPriceLists.includes(list.id)}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedPriceLists(prev => [...prev, list.id]);
                                else setSelectedPriceLists(prev => prev.filter(id => id !== list.id));
                              }}
                            />
                            <label htmlFor={`list-${list.id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {list.name} <span className="text-muted-foreground font-normal">({list.year})</span>
                            </label>
                          </div>
                        ))}
                        {priceLists?.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">Henüz kayıtlı fiyat listesi yok.</p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>İptal</Button>
                      <Button onClick={handleMatch} disabled={matchProject.isPending}>
                        {matchProject.isPending ? 'Eşleştiriliyor...' : 'Eşleştirmeyi Başlat'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="gap-2" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  Excel'e Aktar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <StatBox label="TOPLAM POZ" value={project.itemCount} />
          <StatBox label="EŞLEŞEN" value={project.matchedCount} colorClass="text-status-matched" />
          <StatBox label="BENZER" value={project.fuzzyCount} colorClass="text-status-fuzzy" />
          <StatBox label="EŞLEŞMEYEN" value={project.unmatchedCount} colorClass="text-status-unmatched" />
          <StatBox 
            label="TOPLAM TUTAR" 
            value={project.totalAmount != null ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.totalAmount) : '₺0,00'} 
            isAmount
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
        {isItemsLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : items?.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="w-full max-w-lg border-dashed text-center">
              <CardContent className="pt-10 pb-10">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Teklif Cetveli Yükle</h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  İhale dokümanlarındaki Excel BOQ (Bill of Quantities) dosyasını yükleyerek başlayın.
                </p>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept=".xlsx,.xls" 
                  onChange={handleUploadFile}
                />
                <Button size="lg" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Dosya Yükleniyor...' : 'Excel Dosyası Seç'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div className="border rounded-lg bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/80 sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <TableRow>
                    <TableHead className="w-[60px] text-center">Sıra</TableHead>
                    <TableHead className="w-[140px]">Poz No</TableHead>
                    <TableHead className="min-w-[300px]">Tanım</TableHead>
                    <TableHead className="w-[80px] text-center">Birim</TableHead>
                    <TableHead className="w-[100px] text-right">Miktar</TableHead>
                    <TableHead className="w-[130px] text-center">Durum</TableHead>
                    <TableHead className="w-[150px]">Kaynak Liste</TableHead>
                    <TableHead className="w-[150px] text-right">Birim Fiyat</TableHead>
                    <TableHead className="w-[150px] text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TenderItemRow 
                      key={item.id} 
                      item={item} 
                      projectId={projectId} 
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, colorClass = "text-foreground", isAmount = false }: { label: string, value: string | number, colorClass?: string, isAmount?: boolean }) {
  return (
    <div className="border rounded-md px-4 py-3 bg-slate-50/50">
      <div className="text-[10px] font-bold text-muted-foreground tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-semibold font-mono ${colorClass}`}>
        {value}
      </div>
    </div>
  );
}

function TenderItemRow({ item, projectId }: { item: TenderItem, projectId: number }) {
  const queryClient = useQueryClient();
  const updateItem = useUpdateTenderItem();
  const [localPrice, setLocalPrice] = useState(item.unitPrice?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (!isEditing) {
      setLocalPrice(item.unitPrice?.toString() || '');
    }
  }, [item.unitPrice, isEditing]);

  const handlePriceSave = async () => {
    setIsEditing(false);
    const numPrice = parseFloat(localPrice.replace(',', '.'));
    if (isNaN(numPrice) && localPrice !== '') {
      setLocalPrice(item.unitPrice?.toString() || '');
      return;
    }
    
    const targetPrice = localPrice === '' ? null : numPrice;
    
    if (targetPrice === item.unitPrice) return;

    // Optimistically update
    const previousItems = queryClient.getQueryData<TenderItem[]>(getListTenderItemsQueryKey(projectId));
    if (previousItems) {
      queryClient.setQueryData(
        getListTenderItemsQueryKey(projectId),
        previousItems.map(i => i.id === item.id ? { ...i, unitPrice: targetPrice, totalPrice: targetPrice !== null ? targetPrice * i.quantity : null } : i)
      );
    }

    try {
      await updateItem.mutateAsync({
        id: item.id,
        data: { unitPrice: targetPrice }
      });
      queryClient.invalidateQueries({ queryKey: getGetTenderProjectQueryKey(projectId) });
    } catch (err) {
      // Rollback
      queryClient.setQueryData(getListTenderItemsQueryKey(projectId), previousItems);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setLocalPrice(item.unitPrice?.toString() || '');
      setIsEditing(false);
    }
  };

  const formattedTotal = item.totalPrice != null 
    ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.totalPrice)
    : '-';

  return (
    <TableRow className="group hover:bg-slate-50 transition-colors">
      <TableCell className="text-center text-muted-foreground text-sm">{item.rowOrder}</TableCell>
      <TableCell className="font-mono text-sm font-medium">{item.pozNo}</TableCell>
      <TableCell>
        <div className="text-sm line-clamp-2" title={item.description}>{item.description}</div>
        {item.matchedPozNo && item.matchedPozNo !== item.pozNo && (
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Eşleşen Poz: {item.matchedPozNo}
          </div>
        )}
      </TableCell>
      <TableCell className="text-center text-sm">{item.unit}</TableCell>
      <TableCell className="text-right font-mono text-sm">{item.quantity.toLocaleString('tr-TR')}</TableCell>
      <TableCell className="text-center">
        <MatchStatusBadge status={item.matchStatus} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        <span className="line-clamp-2" title={item.matchedSourceName || ''}>{item.matchedSourceName || '-'}</span>
      </TableCell>
      <TableCell className="text-right">
        <div className="relative">
          <Input 
            value={localPrice}
            onChange={(e) => { setLocalPrice(e.target.value); setIsEditing(true); }}
            onBlur={handlePriceSave}
            onKeyDown={handleKeyDown}
            className={`h-8 text-right font-mono text-sm transition-all focus:ring-primary ${!item.unitPrice && !isEditing ? 'border-dashed border-amber-300 bg-amber-50/30' : ''}`}
            placeholder="0,00"
          />
        </div>
      </TableCell>
      <TableCell className="text-right font-mono font-medium text-sm">
        {formattedTotal}
      </TableCell>
    </TableRow>
  );
}
