import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TariffsTab } from './components/TariffsTab';
import { ZonesTab } from './components/ZonesTab';

export function TariffsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">Tarifas y zonas</h1>
        <p className="text-sm text-slate-500 font-medium">
          Configura cuánto cobras por tipo de vehículo y las rutas con tarifa fija entre ciudades.
        </p>
      </div>

      <Tabs defaultValue="tariffs">
        <TabsList>
          <TabsTrigger value="tariffs">Tarifas</TabsTrigger>
          <TabsTrigger value="zones">Zonas</TabsTrigger>
        </TabsList>

        <TabsContent value="tariffs" className="pt-4">
          <TariffsTab />
        </TabsContent>

        <TabsContent value="zones" className="pt-4">
          <ZonesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
