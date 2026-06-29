import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Food Palace database...');

  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productAddon.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.deliveryArea.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.deliveryAddress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurantSettings.deleteMany();

  await prisma.restaurantSettings.create({
    data: {
      name: 'Food Palace Restaurant',
      phone: '+234 800 000 0000',
      whatsapp: '+2348000000000',
      email: 'info@foodpalace.ng',
      address: 'Kaduna, Nigeria',
      openTime: '08:00',
      closeTime: '22:00',
      isOpen: true,
      bankName: 'MONIEPOINT MFB',
      accountName: 'USMAN SAMBO MARAFA',
      accountNumber: '9110064364',
    },
  });

  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.create({ data: { name: 'Super Admin', email: 'admin@foodpalace.ng', password: adminPassword, role: Role.ADMIN, phone: '+234 800 000 0001' } });

  const customerPassword = await bcrypt.hash('customer123', 12);
  await prisma.user.create({ data: { name: 'Demo Customer', email: 'customer@demo.com', password: customerPassword, role: Role.CUSTOMER, phone: '+234 800 000 0003' } });

  const [mainMeals, burgers, soups, sides, drinks, desserts] = await Promise.all([
    prisma.category.create({ data: { name: 'Main Meals', slug: 'main-meals', description: 'Nigerian rice dishes and staple meals', sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Burgers & Shawarma', slug: 'burgers-shawarma', description: 'Grilled burgers and fresh shawarmas', sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'Soups & Swallow', slug: 'soups-swallow', description: 'Traditional Nigerian soups', sortOrder: 3 } }),
    prisma.category.create({ data: { name: 'Sides', slug: 'sides', description: 'Perfect accompaniments', sortOrder: 4 } }),
    prisma.category.create({ data: { name: 'Drinks', slug: 'drinks', description: 'Refreshing beverages', sortOrder: 5 } }),
    prisma.category.create({ data: { name: 'Desserts', slug: 'desserts', description: 'Sweet treats', sortOrder: 6 } }),
  ]);

  await prisma.product.createMany({
    data: [
      { name: 'Jollof Rice', slug: 'jollof-rice', description: 'Perfectly seasoned Nigerian party jollof rice', price: 2500, categoryId: mainMeals.id, isFeatured: true },
      { name: 'Fried Rice', slug: 'fried-rice', description: 'Nigerian-style fried rice with mixed vegetables', price: 2500, categoryId: mainMeals.id },
      { name: 'White Rice & Stew', slug: 'white-rice-stew', description: 'Fluffy white rice with rich Nigerian tomato stew', price: 2200, categoryId: mainMeals.id },
      { name: 'Rice & Chicken', slug: 'rice-chicken', description: 'Choice of rice with seasoned grilled chicken', price: 3000, categoryId: mainMeals.id, isFeatured: true },
      { name: 'Rice & Turkey', slug: 'rice-turkey', description: 'Choice of rice with succulent turkey', price: 3500, categoryId: mainMeals.id },
      { name: 'Spaghetti', slug: 'spaghetti', description: 'Nigerian-style spaghetti with spiced tomato sauce', price: 2000, categoryId: mainMeals.id },
    ],
  });

  const chickenShawarma = await prisma.product.create({
    data: { name: 'Chicken Shawarma', slug: 'chicken-shawarma', description: 'Fresh chicken shawarma with vegetables and garlic sauce', price: 2500, categoryId: burgers.id, hasVariants: true, isFeatured: true },
  });
  await prisma.productVariant.createMany({
    data: [
      { productId: chickenShawarma.id, name: 'Small', price: 2500, sortOrder: 1 },
      { productId: chickenShawarma.id, name: 'Medium', price: 3500, sortOrder: 2 },
      { productId: chickenShawarma.id, name: 'Large', price: 4500, sortOrder: 3 },
      { productId: chickenShawarma.id, name: 'Jumbo', price: 6000, sortOrder: 4 },
    ],
  });

  const beefShawarma = await prisma.product.create({
    data: { name: 'Beef Shawarma', slug: 'beef-shawarma', description: 'Tender beef strips in flatbread with special sauce', price: 2800, categoryId: burgers.id, hasVariants: true, isFeatured: true },
  });
  await prisma.productVariant.createMany({
    data: [
      { productId: beefShawarma.id, name: 'Small', price: 2800, sortOrder: 1 },
      { productId: beefShawarma.id, name: 'Medium', price: 3800, sortOrder: 2 },
      { productId: beefShawarma.id, name: 'Large', price: 5000, sortOrder: 3 },
      { productId: beefShawarma.id, name: 'Jumbo', price: 6500, sortOrder: 4 },
    ],
  });

  const singleBurger = await prisma.product.create({
    data: { name: 'Single Decker Burger', slug: 'single-decker-burger', description: 'Juicy beef patty with lettuce, tomato and special sauce', price: 2500, categoryId: burgers.id },
  });
  await prisma.productAddon.createMany({ data: [{ productId: singleBurger.id, name: 'Extra Cheese', price: 300 }, { productId: singleBurger.id, name: 'Extra Sauce', price: 200 }] });

  const doubleBurger = await prisma.product.create({
    data: { name: 'Double Decker Burger', slug: 'double-decker-burger', description: 'Two juicy beef patties stacked high', price: 3500, categoryId: burgers.id, isFeatured: true },
  });
  await prisma.productAddon.createMany({ data: [{ productId: doubleBurger.id, name: 'Extra Cheese', price: 300 }, { productId: doubleBurger.id, name: 'Extra Sauce', price: 200 }] });

  await prisma.product.create({ data: { name: 'Single Decker Burger with Cheese', slug: 'single-decker-cheese-burger', description: 'Classic single burger with melted cheese', price: 2800, categoryId: burgers.id } });
  await prisma.product.create({ data: { name: 'Double Decker Burger with Cheese', slug: 'double-decker-cheese-burger', description: 'Double patty with double melted cheese', price: 4000, categoryId: burgers.id } });

  const soupItems = [
    { name: 'Egusi Soup', slug: 'egusi-soup', description: 'Rich melon seed soup with palm oil and assorted meat' },
    { name: 'Miyan Kuka', slug: 'miyan-kuka', description: 'Traditional Northern Nigerian baobab leaf soup' },
    { name: 'Okra Soup', slug: 'okra-soup', description: 'Fresh okra soup with assorted protein' },
    { name: 'Vegetable Soup', slug: 'vegetable-soup', description: 'Fresh mixed vegetables with palm oil' },
  ];
  for (const soup of soupItems) {
    const product = await prisma.product.create({ data: { ...soup, price: 2500, categoryId: soups.id } });
    await prisma.productAddon.createMany({ data: [{ productId: product.id, name: 'Tuwo', price: 500 }, { productId: product.id, name: 'Eba', price: 400 }, { productId: product.id, name: 'Pounded Yam', price: 600 }, { productId: product.id, name: 'Extra Protein (Beef)', price: 800 }] });
  }

  await prisma.product.createMany({
    data: [
      { name: 'Chicken', slug: 'chicken-side', description: 'Seasoned grilled chicken', price: 1500, categoryId: sides.id },
      { name: 'Turkey', slug: 'turkey-side', description: 'Well-seasoned turkey', price: 2000, categoryId: sides.id },
      { name: 'Plantain', slug: 'plantain', description: 'Fried sweet plantain (dodo)', price: 700, categoryId: sides.id },
      { name: 'Fries', slug: 'fries', description: 'Crispy seasoned potato fries', price: 800, categoryId: sides.id },
      { name: 'Moi Moi', slug: 'moi-moi', description: 'Steamed bean pudding with fish and egg', price: 600, categoryId: sides.id },
    ],
  });

  await prisma.product.createMany({
    data: [
      { name: 'Soft Drinks', slug: 'soft-drinks', description: 'Coke, Fanta, Sprite (35cl)', price: 400, categoryId: drinks.id },
      { name: 'Water', slug: 'water', description: 'Chilled bottled water (50cl)', price: 200, categoryId: drinks.id },
      { name: 'Juice', slug: 'juice', description: 'Fresh fruit juice chilled', price: 600, categoryId: drinks.id },
      { name: 'Milkshake', slug: 'milkshake', description: 'Creamy blended milkshake', price: 1200, categoryId: drinks.id },
    ],
  });

  await prisma.product.createMany({
    data: [
      { name: 'Ice Cream', slug: 'ice-cream', description: 'Scoops of creamy ice cream', price: 800, categoryId: desserts.id },
      { name: 'Cake', slug: 'cake', description: 'Slice of freshly baked cake', price: 1000, categoryId: desserts.id },
      { name: 'Doughnuts', slug: 'doughnuts', description: 'Soft glazed doughnuts per piece', price: 400, categoryId: desserts.id },
    ],
  });

  const zoneA = await prisma.deliveryZone.create({ data: { name: 'Zone A', deliveryFee: 1000, estimatedTime: '20-30 mins' } });
  await prisma.deliveryArea.createMany({ data: [{ name: 'Unguwan Dosa', zoneId: zoneA.id }, { name: 'Kawo', zoneId: zoneA.id }, { name: 'Rigasa', zoneId: zoneA.id }, { name: 'Tudun Wada', zoneId: zoneA.id }] });

  const zoneB = await prisma.deliveryZone.create({ data: { name: 'Zone B', deliveryFee: 1500, estimatedTime: '30-45 mins' } });
  await prisma.deliveryArea.createMany({ data: [{ name: 'Barnawa', zoneId: zoneB.id }, { name: 'Kakuri', zoneId: zoneB.id }, { name: 'Sabon Gari', zoneId: zoneB.id }, { name: 'Ungwan Romi', zoneId: zoneB.id }] });

  const zoneC = await prisma.deliveryZone.create({ data: { name: 'Zone C', deliveryFee: 2000, estimatedTime: '45-60 mins' } });
  await prisma.deliveryArea.createMany({ data: [{ name: 'Sabon Tasha', zoneId: zoneC.id }, { name: 'Ungwan Rimi', zoneId: zoneC.id }, { name: 'Badiko', zoneId: zoneC.id }, { name: 'Kabala West', zoneId: zoneC.id }] });

  console.log('Database seeded successfully!');
  console.log('Admin: admin@foodpalace.ng / admin123');
  console.log('Customer: customer@demo.com / customer123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
