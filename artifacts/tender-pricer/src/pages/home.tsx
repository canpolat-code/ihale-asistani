import React from 'react';
import { useListTenderProjects, useCreateTenderProject, useDeleteTenderProject, getListTenderProjectsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Plus, MoreVertical, Trash, Calendar, ArrowRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function Home() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useListTenderProjects();
  const createProject = useCreateTenderProject();
  const deleteProject = useDeleteTenderProject();
  
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    await createProject.mutateAsync(
      { data: { name: newProjectName } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTenderProjectsQueryKey() });
          setIsCreateOpen(false);
          setNewProjectName('');
        }
      }
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    await deleteProject.mutateAsync(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTenderProjectsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">İhale Projeleri</h1>
          <p className="text-muted-foreground mt-1">Aktif ve geçmiş ihale teklif çalışmalarınız.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Proje
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni İhale Projesi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Proje Adı</Label>
                <Input
                  id="name"
                  placeholder="Örn: 2024 Yılı Çevre Düzenleme İhalesi"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
                <Button type="submit" disabled={!newProjectName.trim() || createProject.isPending}>
                  {createProject.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/50" />
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <Card className="text-center py-16 border-dashed bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-semibold">Henüz proje yok</h3>
              <p className="text-muted-foreground mt-1">
                İhale teklif cetvellerini yüklemek ve birim fiyat eşleştirmesi yapmak için yeni bir proje oluşturun.
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              İlk Projeyi Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map(project => (
            <Card key={project.id} className="group hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <CardTitle className="text-lg line-clamp-2 leading-tight">
                      <Link href={`/projeler/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.createdAt), 'd MMM yyyy', { locale: tr })}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 cursor-pointer" onClick={() => handleDelete(project.id)}>
                        <Trash className="w-4 h-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">TOPLAM POZ</div>
                    <div className="text-2xl font-bold font-mono">{project.itemCount}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">EŞLEŞEN</div>
                    <div className="text-2xl font-bold text-status-matched font-mono">{project.matchedCount + project.fuzzyCount}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm font-medium">
                    {project.totalAmount != null ? (
                      <span className="text-foreground">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(project.totalAmount)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Tutar hesaplanmadı</span>
                    )}
                  </div>
                  <Link href={`/projeler/${project.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1.5 -mr-2 group/btn">
                      Detay
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
