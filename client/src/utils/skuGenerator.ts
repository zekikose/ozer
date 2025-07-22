// SKU otomatik oluşturma fonksiyonu
export const generateSKU = (productName: string = '') => {
  if (productName && productName.length > 2) {
    // Türkçe karakterleri değiştir
    const turkishToEnglish: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'C', 'Ğ': 'G', 'I': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
    };
    
    let cleanName = productName;
    Object.keys(turkishToEnglish).forEach(key => {
      cleanName = cleanName.replace(new RegExp(key, 'g'), turkishToEnglish[key]);
    });
    
    // Sadece harf ve rakamları al, boşlukları tire ile değiştir
    const clean = cleanName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toUpperCase();
    
    // İlk 3 kelimenin ilk harflerini al
    const words = clean.split('-').filter(word => word.length > 0);
    const prefix = words.slice(0, 3).map(word => word.charAt(0)).join('');
    
    // Tarih ekle (YYMMDD formatında)
    const now = new Date();
    const date = now.getFullYear().toString().slice(-2) + 
                 (now.getMonth() + 1).toString().padStart(2, '0') + 
                 now.getDate().toString().padStart(2, '0');
    
    // Rastgele 3 haneli sayı ekle
    const random = Math.floor(Math.random() * 900) + 100;
    
    return `${prefix}-${date}-${random}`;
  } else {
    // Ürün adı yoksa basit format kullan
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SKU-${year}${month}${day}-${random}`;
  }
}; 