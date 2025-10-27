use client

import React, { useState } from 'react';
import { Menu, X, Clock, MapPin, Phone, ShoppingCart, Calendar } from 'lucide-react';

// Моковые данные для демонстрации
const menuItems = [
  {
    id: 1,
    name: 'Подвешенная на кости оленина',
    description: 'с древесными грибами и чёрным чесноком',
    price: 870,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
    category: 'Основные блюда'
  },
  {
    id: 2,
    name: 'Салат с копчёной олениной',
    description: 'голубикой и сосновыми шишками',
    price: 840,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    category: 'Салаты'
  },
  {
    id: 3,
    name: 'Стейк Рибай',
    description: 'Сочный стейк из мраморной говядины с овощами гриль',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    category: 'Основные блюда'
  },
  {
    id: 4,
    name: 'Паста с морепродуктами',
    description: 'Домашняя паста с тигровыми креветками и мидиями',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
    category: 'Основные блюда'
  },
  {
    id: 5,
    name: 'Тирамису',
    description: 'Классический итальянский десерт с маскарпоне',
    price: 450,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
    category: 'Десерты'
  },
  {
    id: 6,
    name: 'Томленая щека быка',
    description: 'с овощами и пряными травами',
    price: 1850,
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop',
    category: 'Основные блюда'
  }
];

const tables = [
  { id: 1, number: 1, seats: 2, status: 'available' },
  { id: 2, number: 2, seats: 4, status: 'available' },
  { id: 3, number: 3, seats: 4, status: 'booked' },
  { id: 4, number: 4, seats: 6, status: 'available' },
  { id: 5, number: 5, seats: 2, status: 'booked' },
  { id: 6, number: 6, seats: 8, status: 'available' },
];

export default function RestaurantWebsite() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i));
    } else {
      setCart([...cart, {...item, quantity: 1}]);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-md fixed w-full top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-orange-600">
              Kucher&Conga
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8">
              <button onClick={() => setActiveSection('home')} className="text-gray-700 hover:text-orange-600 transition">Главная</button>
              <button onClick={() => setActiveSection('menu')} className="text-gray-700 hover:text-orange-600 transition">Меню</button>
              <button onClick={() => setActiveSection('booking')} className="text-gray-700 hover:text-orange-600 transition">Бронирование</button>
              <button onClick={() => setActiveSection('delivery')} className="text-gray-700 hover:text-orange-600 transition">Доставка</button>
              <button onClick={() => setActiveSection('contact')} className="text-gray-700 hover:text-orange-600 transition">Контакты</button>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              
              <button 
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2">
              <button onClick={() => { setActiveSection('home'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Главная</button>
              <button onClick={() => { setActiveSection('menu'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Меню</button>
              <button onClick={() => { setActiveSection('booking'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Бронирование</button>
              <button onClick={() => { setActiveSection('delivery'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Доставка</button>
              <button onClick={() => { setActiveSection('contact'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Контакты</button>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        {activeSection === 'home' && (
          <section className="relative h-[600px] bg-gradient-to-r from-orange-600 to-orange-500">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="text-white max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                  Добро пожаловать в Kucher&Conga
                </h1>
                <p className="text-xl mb-8">
                  Традиции, утончённый вкус и безупречная атмосфера
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setActiveSection('menu')}
                    className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
                  >
                    Смотреть меню
                  </button>
                  <button 
                    onClick={() => setActiveSection('booking')}
                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-orange-600 transition"
                  >
                    Забронировать стол
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Menu Section */}
        {activeSection === 'menu' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Наше меню</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="text-sm text-orange-600 mb-2">{item.category}</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-800">{item.price} ₽</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition"
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Booking Section */}
        {activeSection === 'booking' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Бронирование столика</h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6">Доступные столики</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => table.status === 'available' && setSelectedTable(table)}
                      disabled={table.status === 'booked'}
                      className={`p-6 rounded-lg border-2 transition ${
                        table.status === 'booked' 
                          ? 'bg-gray-200 border-gray-300 cursor-not-allowed' 
                          : selectedTable?.id === table.id
                          ? 'bg-orange-100 border-orange-600'
                          : 'bg-white border-gray-300 hover:border-orange-600'
                      }`}
                    >
                      <div className="text-lg font-bold">Стол {table.number}</div>
                      <div className="text-sm text-gray-600">{table.seats} мест</div>
                      <div className={`text-sm mt-2 ${table.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                        {table.status === 'available' ? 'Свободен' : 'Забронирован'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTable && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h3 className="text-2xl font-bold mb-6">Детали бронирования</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Выбранный стол</label>
                      <input 
                        type="text" 
                        value={`Стол ${selectedTable.number} (${selectedTable.seats} мест)`}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Дата</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Время</label>
                      <input 
                        type="time" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Имя</label>
                      <input 
                        type="text" 
                        placeholder="Ваше имя"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Телефон</label>
                      <input 
                        type="tel" 
                        placeholder="+7 (999) 999-99-99"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Бронирование отправлено!');
                      }}
                      className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                    >
                      Забронировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Delivery Section */}
        {activeSection === 'delivery' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Оформление доставки</h2>
            
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Ваш заказ</h3>
                {cart.length === 0 ? (
                  <p className="text-gray-600">Корзина пуста. Добавьте блюда из меню.</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-4">
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-sm text-gray-600">Количество: {item.quantity}</div>
                          </div>
                          <div className="font-bold">{item.price * item.quantity} ₽</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                      <span>Итого:</span>
                      <span>{cartTotal} ₽</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Данные доставки</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Имя</label>
                    <input 
                      type="text" 
                      placeholder="Ваше имя"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Телефон</label>
                    <input 
                      type="tel" 
                      placeholder="+7 (999) 999-99-99"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Адрес доставки</label>
                    <input 
                      type="text" 
                      placeholder="Улица, дом, квартира"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Комментарий к заказу</label>
                    <textarea 
                      placeholder="Особые пожелания"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    disabled={cart.length === 0}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Оформить заказ на {cartTotal} ₽
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Контакты</h2>
            
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Свяжитесь с нами</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Адрес</div>
                      <div className="text-gray-600">г. Дмитров, ул. Промышленная 20Б</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Телефон</div>
                      <div className="text-gray-600">+7 (499) 229-92-22</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Часы работы</div>
                      <div className="text-gray-600">Пн-Вс: 10:00 - 23:00</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Напишите нам</h3>
                <form className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Имя"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                  />
                  <input 
                    type="email" 
                    placeholder="Email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                  />
                  <textarea 
                    placeholder="Сообщение"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none"
                  ></textarea>
                  <button 
                    type="submit"
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                  >
                    Отправить
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-orange-600 mb-4">Kucher&Conga</h3>
              <p className="text-gray-400">Изысканная кухня с 2010 года. Традиции, утончённый вкус и безупречная атмосфера.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Навигация</h4>
              <div className="space-y-2 text-gray-400">
                <div>О нас</div>
                <div>Меню</div>
                <div>Бронирование</div>
                <div>Доставка</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <div className="space-y-2 text-gray-400">
                <div>+7 (499) 229-92-22</div>
                <div>info@kucherandconga.ru</div>
                <div>г. Дмитров, ул. Промышленная 20Б</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2025 Kucher&Conga. Все права защищены.
          </div>-y-2 text-gray-400">
                <div>+7 (495) 123-45-67</div>
                <div>info@labellavita.ru</div>
                <div>ул. Пушкина, 10, Москва</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2024 La Bella Vita. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
    }
