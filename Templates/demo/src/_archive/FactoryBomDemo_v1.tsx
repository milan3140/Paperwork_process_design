/**
 * FactoryBomDemo — Factory-facing RFQ BOM for supplier quoting
 *
 * Uses FactoryBomDocument with qty tiers and fillable price/delivery fields.
 */

import { FactoryBomDocument, type FactoryBomData } from '../../../components/FactoryBomDocument_v1';
import { DownloadPdfButton } from '../DownloadPdfButton';

const sampleBom: FactoryBomData = {
  orderId: 'Q1211263U 噴火槍',
  replyDeadline: '2026-01-15 17:00 前',
  itemCount: 5,
  totalParts: 18,
  parts: [
    {
      partId: 'P01',
      dimsMm: '127 × 89 × 45',
      dimsIn: '5.00 × 3.50 × 1.77',
      weight: '0.34 kg',
      filename: '260129_RFQ_Assembly.stp',
      drawingFilename: 'P01_Assembly_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Aluminum 6061-T6', valueZh: '鋁合金 6061-T6' },
        { label: 'Finish', value: 'Anodize Type II, Black', valueZh: '陽極氧化 Type II, 黑色' },
      ],
      qtyTiers: [1, 5, 10],
    },
    {
      partId: 'P02',
      dimsMm: '88 × 62 × 31',
      dimsIn: '3.46 × 2.44 × 1.22',
      weight: '1.34 kg',
      filename: 'Motor_Housing_v3.stp',
      drawingFilename: 'P02_Motor_Housing_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Stainless Steel 304', valueZh: '不鏽鋼 304' },
        { label: 'Finish', value: 'Standard', valueZh: '標準' },
      ],
      qtyTiers: [2, 4, 8],
    },
    {
      partId: 'P03',
      dimsMm: '65 × 52 × 28',
      dimsIn: '2.56 × 2.05 × 1.10',
      weight: '0.24 kg',
      filename: '260129_RFQ_1.stp',
      drawingFilename: 'P03_Optics_Mount_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Brittle Material', valueZh: 'CNC 硬脆材加工' },
        { label: 'Material', value: 'ZERODUR' },
        { label: 'Finish', value: 'Etching', valueZh: '蝕刻' },
      ],
      qtyTiers: [1, 3],
    },
    {
      partId: 'P04',
      dimsMm: '220 × 180 × 55',
      dimsIn: '8.66 × 7.09 × 2.17',
      weight: '2.18 kg',
      filename: 'Base_Plate_Rev4.stp',
      drawingFilename: 'P04_Base_Plate_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Aluminum 6061-T6', valueZh: '鋁合金 6061-T6' },
        { label: 'Finish', value: 'As-Machined', valueZh: '素材' },
      ],
      qtyTiers: [5, 10, 20],
    },
    {
      partId: 'P05',
      dimsMm: '35 × 12 × 8',
      dimsIn: '1.38 × 0.47 × 0.31',
      weight: '0.02 kg',
      filename: 'Pin_Connector.stp',
      drawingFilename: 'P05_Pin_Connector_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Stainless Steel 316L', valueZh: '不鏽鋼 316L' },
        { label: 'Finish', value: 'Electropolish', valueZh: '電解拋光' },
      ],
      qtyTiers: [5, 10, 50],
    },
  ],
};

export default function FactoryBomDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
      <DownloadPdfButton filename="Factory-BOM-v1" />
      <FactoryBomDocument data={sampleBom} />
    </div>
  );
}
