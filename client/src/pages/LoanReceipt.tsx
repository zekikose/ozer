import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  FileText, 
  Package, 
  User, 
  Calendar,
  DollarSign,
  ArrowLeft,
  Printer,
  Download
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptData {
  id: number;
  date: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  product: {
    name: string;
    sku: string;
    description: string;
    unit: string;
    unit_price: number;
    cost_price: number;
    min_stock_level: number;
    current_stock: number;
    category_name: string;
    warehouse_name: string;
  };
  quantity: number;
  unit_price: number;
  total_amount: number;
  reference_number: string;
  notes: string;
  status: string;
  return_date: string | null;
}

const LoanReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch receipt data
  const { data, isLoading, error } = useQuery(
    ['loanReceipt', id],
    async () => {
      const response = await axios.get(`/api/stock/loans/${id}/receipt`);
      return response.data.receipt;
    },
    {
      onSuccess: (data) => {
        setReceiptData(data);
      }
    }
  );

  const generatePDF = async () => {
    if (!receiptRef.current || !receiptData) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `emanet-tutanagi-${receiptData.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tutanak bulunamadı</h3>
          <p className="text-gray-600">Belirtilen emanet tutanağı mevcut değil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print CSS */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print-hide { display: none !important; }
          .print-show { display: block !important; }
          .receipt-content { 
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
        }
      `}</style>
      
      {/* Print Header - Hidden on screen */}
      <div className="hidden print:block bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">EMANET TUTANAĞI</h1>
          <p className="text-gray-600 mt-2">Stok Yönetim Sistemi</p>
        </div>
      </div>

      {/* Screen Header */}
      <div className="print:hidden print-hide bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Emanet Tutanağı</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'PDF Oluşturuluyor...' : 'PDF İndir'}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Printer className="h-4 w-4 mr-2" />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div ref={receiptRef} className="bg-white shadow-lg rounded-lg overflow-hidden receipt-content">
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">EMANET TUTANAĞI</h2>
                <p className="text-blue-100 mt-2">Stok Yönetim Sistemi</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">#{receiptData.id}</div>
                <div className="text-blue-100 text-sm">Tutanak No</div>
              </div>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Müşteri Bilgileri</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Ad Soyad:</span>
                      <p className="text-gray-900 font-medium">{receiptData.customer.name}</p>
                    </div>
                    {receiptData.customer.phone && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Telefon:</span>
                        <p className="text-gray-900">{receiptData.customer.phone}</p>
                      </div>
                    )}
                    {receiptData.customer.email && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">E-posta:</span>
                        <p className="text-gray-900">{receiptData.customer.email}</p>
                      </div>
                    )}
                    {receiptData.customer.address && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Adres:</span>
                        <p className="text-gray-900 text-sm">{receiptData.customer.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Package className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Ürün Bilgileri</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Ürün Adı:</span>
                      <p className="text-gray-900 font-medium">{receiptData.product.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">SKU:</span>
                      <p className="text-gray-900 font-mono">{receiptData.product.sku}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Kategori:</span>
                      <p className="text-gray-900">{receiptData.product.category_name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Depo:</span>
                      <p className="text-gray-900">{receiptData.product.warehouse_name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Birim:</span>
                      <p className="text-gray-900">{receiptData.product.unit || 'adet'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Miktar:</span>
                      <p className="text-gray-900 font-medium">{receiptData.quantity} {receiptData.product.unit || 'adet'}</p>
                    </div>
                    {receiptData.product.description && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Açıklama:</span>
                        <p className="text-gray-900 text-sm">{receiptData.product.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Transaction Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">İşlem Detayları</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Emanet Tarihi:</span>
                      <p className="text-gray-900 font-medium">
                        {new Date(receiptData.date).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {new Date(receiptData.date).toLocaleTimeString('tr-TR')}
                      </p>
                    </div>
                    {receiptData.return_date && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">İade Tarihi:</span>
                        <p className="text-gray-900 font-medium">
                          {new Date(receiptData.return_date).toLocaleDateString('tr-TR')}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {new Date(receiptData.return_date).toLocaleTimeString('tr-TR')}
                        </p>
                      </div>
                    )}
                    {receiptData.reference_number && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Referans No:</span>
                        <p className="text-gray-900 font-mono">{receiptData.reference_number}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Durum:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        receiptData.status === 'active' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {receiptData.status === 'active' ? 'Aktif' : 'İade Edildi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Finansal Bilgiler</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Birim Fiyat:</span>
                      <p className="text-gray-900 font-medium">₺{parseFloat(receiptData.unit_price?.toString() || '0').toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Miktar:</span>
                      <p className="text-gray-900 font-medium">{receiptData.quantity} {receiptData.product.unit || 'adet'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Toplam Tutar:</span>
                      <p className="text-2xl font-bold text-green-600">₺{parseFloat(receiptData.total_amount?.toString() || '0').toFixed(2)}</p>
                    </div>
                    {receiptData.product.cost_price && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Maliyet Fiyatı:</span>
                        <p className="text-gray-900">₺{parseFloat(receiptData.product.cost_price?.toString() || '0').toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {receiptData.notes && (
              <div className="mt-8 bg-yellow-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Notlar</h3>
                </div>
                <p className="text-gray-700">{receiptData.notes}</p>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Şartlar ve Koşullar</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>1. Emanet alınan ürünler belirtilen süre içinde iade edilmelidir.</p>
                <p>2. Ürünler orijinal durumunda iade edilmelidir.</p>
                <p>3. Hasarlı veya eksik ürünler için sorumluluk emanet alan kişiye aittir.</p>
                <p>4. Bu tutanak emanet işleminin resmi belgesidir.</p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t-2 border-gray-300 pt-4">
                  <p className="text-sm text-gray-500">Emanet Veren</p>
                  <p className="text-gray-900 font-medium mt-2">İmza</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-300 pt-4">
                  <p className="text-sm text-gray-500">Emanet Alan</p>
                  <p className="text-gray-900 font-medium mt-2">İmza</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanReceipt;
