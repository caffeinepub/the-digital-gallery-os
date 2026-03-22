import Text "mo:core/Text";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

actor {
  // Types
  type OrderStatus = {
    #pending;
    #ready;
    #delivered;
  };

  type FramingItem = {
    size : Text;
    thickness : Float;
    quantity : Nat;
    unitPrice : Float;
  };

  type CustomerOrder = {
    id : Nat;
    customerName : Text;
    orderDate : Time.Time;
    items : [FramingItem];
    totalAmount : Float;
    advancePaid : Float;
    balanceDue : Float;
    status : OrderStatus;
  };

  module CustomerOrder {
    public func compare(order1 : CustomerOrder, order2 : CustomerOrder) : Order.Order {
      Nat.compare(order1.id, order2.id);
    };
  };

  type SupplierNote = {
    text : Text;
    timestamp : Time.Time;
  };

  var nextOrderId = 1;

  // Persistent Data Structures
  let orders = Map.empty<Nat, CustomerOrder>();
  let inventory = Map.empty<Text, Nat>();
  let supplierNotes = List.empty<SupplierNote>();

  // Order Management
  public func createOrder(customerName : Text, items : [FramingItem], totalAmount : Float, advancePaid : Float) : async Nat {
    let id = nextOrderId;
    let newOrder : CustomerOrder = {
      id;
      customerName;
      orderDate = Time.now();
      items;
      totalAmount;
      advancePaid;
      balanceDue = totalAmount - advancePaid;
      status = #pending;
    };

    orders.add(id, newOrder);
    nextOrderId += 1;
    id;
  };

  func doGetOrder(id : Nat) : CustomerOrder {
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };
  };

  public query func getOrder(id : Nat) : async CustomerOrder {
    doGetOrder(id);
  };

  public query func getAllOrders() : async [CustomerOrder] {
    orders.values().toArray().sort();
  };

  public func updateOrderStatus(id : Nat, status : OrderStatus) : async () {
    let order = doGetOrder(id);
    orders.add(id, { order with status });
  };

  public func settleBalance(id : Nat, amountPaid : Float) : async () {
    let order = doGetOrder(id);
    if (order.balanceDue == 0.0) { Runtime.trap("Order already fully paid") };
    let newBalance = order.balanceDue - amountPaid;
    orders.add(id, { order with advancePaid = order.advancePaid + amountPaid; balanceDue = if (newBalance < 0.0) { 0.0 } else { newBalance } });
  };

  // Inventory Management
  public func updateInventorySize(size : Text, quantity : Nat) : async () {
    inventory.add(size, quantity);
  };

  public func incrementStock(size : Text, amount : Nat) : async () {
    let current = switch (inventory.get(size)) {
      case (null) { 0 };
      case (?qty) { qty };
    };
    inventory.add(size, current + amount);
  };

  public func decrementStock(size : Text, amount : Nat) : async () {
    let current = switch (inventory.get(size)) {
      case (null) { 0 };
      case (?qty) { qty };
    };
    if (amount > current) { Runtime.trap("Not enough stock") };
    inventory.add(size, current - amount);
  };

  public query func getStockCount(size : Text) : async Nat {
    switch (inventory.get(size)) {
      case (null) { 0 };
      case (?qty) { qty };
    };
  };

  public query func getAllInventory() : async [(Text, Nat)] {
    inventory.toArray();
  };

  // Supplier Notes
  public func addSupplierNote(text : Text) : async () {
    let note : SupplierNote = {
      text;
      timestamp = Time.now();
    };
    supplierNotes.add(note);
  };

  public query func getAllSupplierNotes() : async [SupplierNote] {
    supplierNotes.toArray();
  };
};
