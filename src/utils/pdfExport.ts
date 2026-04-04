import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Book } from '../types';

export async function exportBookToPdf(book: Book): Promise<void> {
  const isRtl = book.language === 'he';
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${pageWidth}mm`;
  container.style.background = 'white';
  document.body.appendChild(container);

  // Title page
  const titlePage = document.createElement('div');
  titlePage.style.width = '794px';
  titlePage.style.height = '1123px';
  titlePage.style.display = 'flex';
  titlePage.style.flexDirection = 'column';
  titlePage.style.alignItems = 'center';
  titlePage.style.justifyContent = 'center';
  titlePage.style.fontFamily = isRtl ? 'David Libre, serif' : 'Merriweather, serif';
  titlePage.style.direction = isRtl ? 'rtl' : 'ltr';
  titlePage.style.background = 'white';
  titlePage.style.padding = '40px';
  titlePage.style.boxSizing = 'border-box';
  titlePage.innerHTML = `
    <div style="text-align: center;">
      <h1 style="font-size: 48px; margin-bottom: 24px; color: #1a1a2e;">${book.title}</h1>
      <div style="width: 200px; height: 2px; background: #d4a574; margin: 24px auto;"></div>
      <h2 style="font-size: 28px; color: #555; font-weight: 400; margin-top: 24px;">${book.author}</h2>
    </div>
  `;
  container.appendChild(titlePage);

  try {
    const titleCanvas = await html2canvas(titlePage, { scale: 2, useCORS: true });
    const titleImg = titleCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(titleImg, 'JPEG', 0, 0, pageWidth, pageHeight);

    // Content pages
    for (let i = 0; i < book.pages.length; i++) {
      const page = book.pages[i];
      pdf.addPage();

      const pageDiv = document.createElement('div');
      pageDiv.style.width = '794px';
      pageDiv.style.minHeight = '1123px';
      pageDiv.style.padding = '80px 70px';
      pageDiv.style.boxSizing = 'border-box';
      pageDiv.style.fontFamily = isRtl ? 'David Libre, serif' : 'Merriweather, serif';
      pageDiv.style.direction = isRtl ? 'rtl' : 'ltr';
      pageDiv.style.background = 'white';
      pageDiv.style.fontSize = '16px';
      pageDiv.style.lineHeight = '1.8';
      pageDiv.style.color = '#1a1a2e';

      pageDiv.innerHTML = `
        <div style="min-height: 963px;">${page.content || '<p style="color: #ccc;">עמוד ריק</p>'}</div>
        <div style="text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee;">
          ${page.pageNumber}
        </div>
      `;
      container.innerHTML = '';
      container.appendChild(pageDiv);

      const canvas = await html2canvas(pageDiv, { scale: 2, useCORS: true });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    const safeTitle = book.title.replace(/[^a-zA-Zא-ת0-9]/g, '_').trim() || 'book';
    const filename = `${safeTitle}.pdf`;

    const arrayBuffer = pdf.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Create an explicit anchor element
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 1000);
  } finally {
    document.body.removeChild(container);
  }
}
