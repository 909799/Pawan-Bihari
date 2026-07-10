'use strict';

/**
 * PDF export functionality for Ami Polymer Film Formulation Calculator
 * @module pdfExport
 */

/**
 * Export current calculation as PDF
 */
async function exportPDF() {
  recalculate();
  
  if (!calculationState.isValid) {
    showAlert('Cannot export: fix validation errors first', 'error');
    return;
  }

  const productName = prompt('Product Name:');
  if (!productName) return;
  
  const operatorName = prompt('Operator Name:');
  if (!operatorName) return;

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    let y = 18;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Title
    pdf.setFontSize(24);
    pdf.text('Ami Polymer Multilayer Film Formulation', centerX, y, { align: 'center' });
    y += 10;
    pdf.setFontSize(16);
    pdf.text('Multi-Layer Film Production Summary', centerX, y, { align: 'center' });
    y += 10;

    // Info block
    pdf.setFontSize(13);
    pdf.text(`Date: ${dateStr}    Time: ${timeStr}`, centerX, y, { align: 'center' });
    y += 7;
    pdf.text(`Product: ${sanitizeText(productName)}`, centerX, y, { align: 'center' });
    y += 6;
    pdf.text(`Operator: ${sanitizeText(operatorName)}`, centerX, y, { align: 'center' });
    y += 8;

    pdf.text(
      `Die Width: ${calculationState.dieWidth} mm   •   Speed: ${calculationState.lineSpeed} m/min   •   Hours: ${calculationState.hours}`,
      centerX, y, { align: 'center' }
    );
    y += 7;
    pdf.text(
      `Total: ${calculationState.totalWeight.toFixed(2)} kg   •   Length: ${calculationState.filmLength.toFixed(2)} m   •   Scrap: ${calculationState.wastage.toFixed(2)} kg`,
      centerX, y, { align: 'center' }
    );
    y += 12;

    // Table
    renderPDFTable(pdf, y, pageWidth, pageHeight, centerX);

    pdf.save('filmformulation-summary.pdf');
    showAlert('✓ PDF exported successfully', 'success');
  } catch (e) {
    showAlert('Error exporting PDF: ' + e.message, 'error');
  }
}

/**
 * Render data table in PDF
 * @param {Object} pdf - jsPDF instance
 * @param {number} startY - Starting Y position
 * @param {number} pageWidth - PDF page width
 * @param {number} pageHeight - PDF page height
 * @param {number} centerX - Center X position
 * @private
 */
function renderPDFTable(pdf, startY, pageWidth, pageHeight, centerX) {
  const margin = 12;
  const tWidth = pageWidth - margin * 2;
  const colW = {
    ext: tWidth * 0.22,
    mat: tWidth * 0.32,
    thk: tWidth * 0.10,
    den: tWidth * 0.10,
    kghr: tWidth * 0.09,
    tot: tWidth * 0.09,
    scrap: tWidth * 0.08
  };

  let y = startY;
  let x = margin;

  // Table headers
  pdf.setFontSize(13);
  pdf.text('Extruder', x + colW.ext / 2, y, { align: 'center' }); x += colW.ext;
  pdf.text('Material', x + colW.mat / 2, y, { align: 'center' }); x += colW.mat;
  pdf.text('Thk (µ)', x + colW.thk / 2, y, { align: 'center' }); x += colW.thk;
  pdf.text('Density', x + colW.den / 2, y, { align: 'center' }); x += colW.den;
  pdf.text('kg/hr', x + colW.kghr / 2, y, { align: 'center' }); x += colW.kghr;
  pdf.text('Total kg', x + colW.tot / 2, y, { align: 'center' }); x += colW.tot;
  pdf.text('Scrap kg', x + colW.scrap / 2, y, { align: 'center' });

  y += 3;
  pdf.line(margin, y, margin + tWidth, y);
  y += 7;

  // Table data
  pdf.setFontSize(12);
  calculationState.layers.forEach(layer => {
    if (y > pageHeight - 15) {
      pdf.addPage();
      y = 20;
    }

    let rowX = margin;
    const extShort = (layer.name || '').substring(0, 20);
    const matShort = (layer.material || '').substring(0, 32);

    pdf.text(extShort, rowX + colW.ext / 2, y, { align: 'center' }); rowX += colW.ext;
    pdf.text(matShort, rowX + colW.mat / 2, y, { align: 'center' }); rowX += colW.mat;
    pdf.text(layer.microns.toFixed(1), rowX + colW.thk / 2, y, { align: 'center' }); rowX += colW.thk;
    pdf.text(layer.density.toFixed(2), rowX + colW.den / 2, y, { align: 'center' }); rowX += colW.den;
    pdf.text(layer.throughput.toFixed(1), rowX + colW.kghr / 2, y, { align: 'center' }); rowX += colW.kghr;
    pdf.text(layer.consumeKg.toFixed(1), rowX + colW.tot / 2, y, { align: 'center' }); rowX += colW.tot;
    pdf.text(layer.scrapKg.toFixed(1), rowX + colW.scrap / 2, y, { align: 'center' });

    y += 8;
  });
}
