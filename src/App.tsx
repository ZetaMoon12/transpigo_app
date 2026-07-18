import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { AuthProvider, TenantProvider } from '@/context';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </TenantProvider>
  );
}

export default App;

