import { formatISODate } from "@/utils/date";

export async function uploadBackupToGoogleDrive(jsonData: string): Promise<boolean> {
  const token = localStorage.getItem('google_provider_token');
  if (!token) {
    throw new Error('Permissão do Google Drive ausente. Faça login novamente clicando com o botão do Google na tela inicial.');
  }

  const fileName = `CRM-Backup-${formatISODate(new Date())}.json`;
  
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const boundary = 'foo_bar_baz';
  
  // Multipart body format required by Google Drive API
  const body = `
--${boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(metadata)}
--${boundary}
Content-Type: application/json

${jsonData}
--${boundary}--
`;

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body.trim(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API do Google Drive:', errorData);
      
      // Clear token if it's invalid
      if (response.status === 401) {
        localStorage.removeItem('google_provider_token');
        throw new Error('Sessão expirada no Google. Por favor, deslogue e faça login de novo pelo Google para renovar a permissão.');
      }
      
      throw new Error(errorData.error?.message || 'Falha ao enviar backup para o Google Drive.');
    }
    
    return true;
  } catch (error) {
    console.error('Falha no upload para o Drive:', error);
    throw error;
  }
}
