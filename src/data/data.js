const shipments = [
    {
      siNumber: '12345',
      status: '出荷済',
      eta: '2025-05-20',
      etd: '2025-05-10',
      delayed: false,
      items: [
        { name: '商品A', quantity: 100 },
        { name: '商品B', quantity: 500 },
      ],
    },
    {
      siNumber: '67890',
      status: '通関中',
      eta: '2025-05-23',
      etd: '2025-05-12',
      delayed: true,
      items: [{ name: '商品C', quantity: 300 }],
    },
    {
      siNumber: '54321',
      status: '入港待ち',
      eta: '2025-05-18',
      etd: '2025-05-08',
      delayed: false,
      items: [{ name: '商品D', quantity: 250 }],
    },
  ];
  
  export default shipments;
  