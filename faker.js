const mysql = require('mysql2');
const { faker } = require('@faker-js/faker');

const connection = mysql.createConnection({
  host: 'localhost', // jika ingin mengakses localhost bisa pakai ip 127.0.0.1
  user: 'masukan_user_sesuai_yang_dipakai', // sesuiakan apa yang ingin dipakai
  password: 'password_user', // isi password sesuai password db user
  database: 'nama_database' // isi nama database sesuai dengan keinginan masing"
});

const randomDate = () => {
  return faker.date.between({ from: '2015-01-01', to: '2024-12-31' }); 
};

const insertCustomers = async () => {
  for (let i = 0; i < 400001; i++) { // melakukan perulangan sebanyak 400000x
    const query = `INSERT INTO customer (CustomerID, customer_name, customer_phone, create_date, delete_date)
                   VALUES (?, ?, ?, ?, ?)`;
    const values = [
      i,
      faker.person.fullName(),
      faker.phone.number("international"),
      randomDate(),
      null
    ];
    await connection.promise().query(query, values);
  }
  console.log('Inserted Customers');
};

const insertItemsGrocery = async () => {
  for (let i = 0; i < 500001; i++) { // melakukan perulangan sebanyak 500000x
    const query = `INSERT INTO Items_Grocery (Items_GroceryID, Items_Grocery_product, Items_Grocery_price, Items_Grocery_isbn, Items_Groceryc_quantity, create_date, last_update)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      i,
      faker.commerce.productName(),
      faker.commerce.price(),
      faker.string.uuid(),
      faker.number.int({ min: 1, max: 100 }),
      randomDate(),
      randomDate()
    ];
    await connection.promise().query(query, values);
  }
  console.log('Inserted Items Grocery');
};

const insertEmployees = async () => {
  for (let i = 0; i < 100001; i++) { // melakukan perulangan sebanyak 100000x
    let role;

    if (i < 5) { // melakukan pengecekan untuk employee_role = manager dibataskan 5
      role = 'Manager';
    } else {
      role = faker.helpers.arrayElement(['Cashier', 'Stock Keeper', 'Security', 'Cleaner', 'Accountant', 'Marketing']);
    }
    
    const query = `INSERT INTO Employee (EmployeeID, employee_name, employee_email, employee_role, create_date, DELETED_ADD)
                   VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [
      i,
      faker.person.fullName(),
      faker.internet.email(),
      role,
      randomDate(),
      null
    ];
    await connection.promise().query(query, values);
  }
  console.log('Inserted Employees');
};

const getStockKeeperIDs = async () => { // mendapatkan ID yang dimana employee_role = stock keeper ID dari customerID
  const [rows] = await connection.promise().query(
    "SELECT EmployeeID FROM Employee WHERE employee_role = 'Stock Keeper'"
  );
  return rows.map(row => row.EmployeeID);
};

const getCashierIDs = async () => { // mendapatkan ID yang dimana employee_role = cashier ID dari customerID
  const [rows] = await connection.promise().query(
    "SELECT EmployeeID FROM Employee WHERE employee_role = 'Cashier'"
  );
  return rows.map(row => row.EmployeeID);
};

const getValidItemsGroceryIDs = async () => { 
  const [rows] = await connection.promise().query(
    "SELECT Items_GroceryID FROM Items_Grocery"
  );
  return rows.map(row => row.Items_GroceryID);
}

const getCostumerIDs = async () => { // mendapatkan customerID yang dimana costumerID = customer tersebut dan digunakan pada tabel transaction
  const [rows] = await connection.promise().query(
    "SELECT CustomerID FROM customer"
  );
  return rows.map(row => row.CustomerID);
}

const insertTransactions = async () => {
  const itemsGroceryIDs = await getValidItemsGroceryIDs();
  if (itemsGroceryIDs.length === 0) {
    console.log("No Items Grocery found! Transactions cannot be inserted.");
    return;
  }

  const customerIDs = await getCostumerIDs();
  if (customerIDs.length === 0) {
    console.log("No Customers found! Transactions cannot be inserted.");
    return;
  }

  const cashierIDs = await getCashierIDs();
  if (cashierIDs.length === 0) {
    console.log("No Cashiers found! Transactions cannot be inserted.");
    return;
  }

  for (let i = 0; i < 500001; i++) { // melakukan perulangan sebanyak 500000x
    const itemGroceryID = faker.helpers.arrayElement(itemsGroceryIDs); 
    const customerID = faker.helpers.arrayElement(customerIDs); 
    const cashierID = faker.helpers.arrayElement(cashierIDs); 
    
    const query = `INSERT INTO transaction (transaction_date, Items_GroceryID, total_amount, CustomerID, EmployeeID, create_date)
                   VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [
      randomDate(),
      itemGroceryID, 
      faker.commerce.price(),
      customerID, 
      cashierID,
      randomDate()
    ];
    
    await connection.promise().query(query, values);
  }
  console.log('Inserted Transactions using only Cashiers');
};

const insertUpdateStock = async () => {
  const stockKeeperIDs = await getStockKeeperIDs(); 
  if (stockKeeperIDs.length === 0) {
    console.log("No Stock Keepers found! Update Stock cannot be inserted.");
    return;
  }

  for (let i = 0; i < 500001; i++) { // melakukan perulangan sebanyak 500000x
    const itemGroceryID = i; 
    const stockKeeperID = faker.helpers.arrayElement(stockKeeperIDs); 

    const query = `INSERT INTO Update_Stock (Update_StockID, Update_Stock_product, Update_Stock_quantity, EmployeeID, Items_GroceryID, create_date, last_update)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      i,
      faker.commerce.productName(),
      faker.number.int({ min: 1, max: 50 }),
      stockKeeperID,
      itemGroceryID,
      randomDate(),
      randomDate()
    ];
    await connection.promise().query(query, values);
  }
  console.log('Inserted Update Stock');
};

const generateData = async () => {
  const globalStartTime = Date.now();

  console.log('Starting fake data generation...');
  await insertCustomers();
  await insertItemsGrocery();
  await insertEmployees();
  await insertTransactions();
  await insertUpdateStock();

  const globalEndTime = Date.now();
  const totalDuration = ((globalEndTime - globalStartTime) / 400001).toFixed(2);
  console.log('Fake data generation completed.');
  console.log(`Total Execution Time: ${totalDuration} seconds.`);
  connection.end();
};

generateData().catch(console.error);
