// Проверка входных данных
function validateData(data) {
    // Общая проверка существования данных
    if (!data) throw new Error("Переданы пустые данные");
    
    // Проверка, что данные содержат требуемые свойства
    if (
        typeof data !== 'object' ||
        !Array.isArray(data.sellers) ||      // Массив продавцов
        !Array.isArray(data.products) ||     // Массив продуктов
        !Array.isArray(data.purchase_records)// Массив чеков
    ) {
        throw new Error("Недопустимый формат данных: продавцы, продукты или чеки не представлены в виде массивов.");
    }
    
    // Проверка непустоты массивов
    if (
        data.sellers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0
    ) {
        throw new Error("Один или несколько массивов данных пустые.");
    }
    console.log("Проверка прошла успешно!");
}    
    
/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
   // @TODO: Расчет выручки от операции
    const discountFactor = (purchase.discount / 100);// Расчёт коэффициента скидки
    const fullPrice = purchase.sale_price * purchase.quantity;
    const revenue = fullPrice * (1 - discountFactor);// Формула расчёта прибыли

    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    // @TODO: Расчет бонуса от позиции в рейтинге 
    if (index === 0) {                 // Первый продавец (самый высокий)
        return seller.profit * 0.15;       // 15%
    } else if (index <= 2) {           // Второй и третий продавцы
        return seller.profit * 0.10;       // 10%
    } else if (index !== total - 1) {  // Все остальные, кроме последнего
        return seller.profit * 0.05;       // 5%
    } else {                           // Последнее место
        return 0;                      // Нет бонуса
    }
}
    
/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка входных данных
    validateData(data)
    // @TODO: Проверка наличия опций
    if (
        typeof options !== "object"
    ) {
        throw new Error("Опции — это не объект.");
    }
    // @TODO: Проверка наличия функций
    if (
        typeof calculateRevenue !== "function" ||
        typeof calculateBonus !== "function"
    ) {
        throw new Error("calculateRevenue и calculateBonus не функция");
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(
        sellerStats.map(seller => [seller.id, seller])
    );

    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count++; // Увеличить количество продаж 
        seller.revenue += record.total_amount; // Увеличить общую сумму всех продаж
        
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            let cost = product.purchase_price * item.quantity;// Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            let revenue = calculateRevenue(item); // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            let profit = revenue - cost; // Посчитать прибыль: выручка минус себестоимость
            seller.profit += profit;// Увеличить общую накопленную прибыль (profit) у продавца 

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;// По артикулу товара увеличить его проданное количество у продавца
        });                
    });
    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => {
        return b.profit - a.profit;
    });

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller)// Считаем бонус
        seller.top_products = Object.entries(
            seller.products_sold
        ).map(
            item => ({ sku: item[0], quantity: item[1] })
        ).sort((a, b) => {
            return b.quantity - a.quantity;
        }).slice(0, 10)// Формируем топ-10 товаров
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
        return sellerStats.map(seller => ({
        seller_id: seller.id,      // Идентификатор продавца
        name: seller.name,                // Имя продавца
        revenue: +seller.revenue.toFixed(2),  // Выручка с округлением до 2 знаков после точки
        profit: +seller.profit.toFixed(2),    // Прибыль с округлением до 2 знаков после точки
        sales_count: seller.sales_count,    // Количество продаж остается целым числом
        top_products: seller.top_products, // Топ-продукты продавца остаются без изменения формата
        bonus: +seller.bonus.toFixed(2)     // Бонус также приводится к формату с двумя десятичными знаками
    }));
}