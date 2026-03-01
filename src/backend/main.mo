import Array "mo:core/Array";
import Blob "mo:core/Blob";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Debug "mo:core/Debug";
import Option "mo:core/Option";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  type Store = {
    id : Nat;
    ownerId : Principal;
    name : Text;
    slug : Text;
    description : Text;
    bannerImageId : ?Blob;
    isActive : Bool;
    createdAt : Time.Time;
  };

  type Product = {
    id : Nat;
    storeId : Nat;
    name : Text;
    description : Text;
    price : Nat;
    stock : Nat;
    category : Text;
    imageId : ?Blob;
    isActive : Bool;
    createdAt : Time.Time;
  };

  type Order = {
    id : Nat;
    storeId : Nat;
    buyerName : Text;
    buyerEmail : Text;
    buyerPrincipal : ?Principal;
    items : [OrderItem];
    totalPrice : Nat;
    status : OrderStatus;
    createdAt : Time.Time;
  };

  type OrderItem = {
    productId : Nat;
    productName : Text;
    quantity : Nat;
    unitPrice : Nat;
  };

  type OrderStatus = {
    #pending;
    #fulfilled;
    #cancelled;
  };

  type StoreAnalytics = {
    totalOrders : Nat;
    totalRevenue : Nat;
    topProducts : [(Nat, Text, Nat)]; // (productId, productName, quantitySold)
  };

  module Store {
    public func compare(store1 : Store, store2 : Store) : Order.Order {
      Nat.compare(store1.id, store2.id);
    };
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Nat.compare(product1.id, product2.id);
    };
  };

  var storeIdCounter = 0;
  var productIdCounter = 0;
  var orderIdCounter = 0;

  let stores = Map.empty<Nat, Store>();
  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Store Management
  public shared ({ caller }) func createStore(name : Text, slug : Text, description : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create stores");
    };

    let existingStore = stores.values().toArray().find(func(store : Store) : Bool { store.ownerId == caller });
    switch (existingStore) {
      case (?_) { Runtime.trap("Each user can only create one store") };
      case (null) {};
    };

    let currentTime = Time.now();
    let storeId = storeIdCounter;
    storeIdCounter += 1;

    let store : Store = {
      id = storeId;
      ownerId = caller;
      name;
      slug;
      description;
      bannerImageId = null;
      isActive = true;
      createdAt = currentTime;
    };

    stores.add(storeId, store);
    storeId;
  };

  public shared ({ caller }) func updateStore(storeId : Nat, name : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update stores");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);

    let updatedStore : Store = {
      store with
      name;
      description;
    };

    stores.add(storeId, updatedStore);
  };

  public query ({ caller }) func getStore(storeId : Nat) : async Store {
    // Anyone can view stores (including guests)
    getStoreInternal(storeId);
  };

  public query ({ caller }) func getStoreBySlug(slug : Text) : async Store {
    // Anyone can view stores (including guests)
    switch (stores.values().toArray().find(func(store : Store) : Bool { store.slug == slug })) {
      case (?store) { store };
      case (null) { Runtime.trap("Store not found") };
    };
  };

  public query ({ caller }) func getMyStore() : async Store {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their store");
    };
    switch (stores.values().toArray().find(func(store : Store) : Bool { store.ownerId == caller })) {
      case (?store) { store };
      case (null) { Runtime.trap("Store not found") };
    };
  };

  public query ({ caller }) func listAllStores() : async [Store] {
    // Anyone can view stores (including guests)
    stores.values().toArray().sort();
  };

  public shared ({ caller }) func deleteStore(storeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete stores");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);
    stores.remove(storeId);
  };

  // Product Management
  public shared ({ caller }) func addProduct(storeId : Nat, name : Text, description : Text, price : Nat, stock : Nat, category : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add products");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);

    let currentTime = Time.now();
    let productId = productIdCounter;
    productIdCounter += 1;

    let product : Product = {
      id = productId;
      storeId;
      name;
      description;
      price;
      stock;
      category;
      imageId = null;
      isActive = true;
      createdAt = currentTime;
    };

    products.add(productId, product);
    productId;
  };

  public shared ({ caller }) func updateProduct(productId : Nat, name : Text, description : Text, price : Nat, stock : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update products");
    };
    let product = getProductInternal(productId);
    let store = getStoreInternal(product.storeId);
    assertStoreOwner(store.ownerId, caller);

    let updatedProduct : Product = {
      product with
      name;
      description;
      price;
      stock;
    };

    products.add(productId, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete products");
    };
    let product = getProductInternal(productId);
    let store = getStoreInternal(product.storeId);
    assertStoreOwner(store.ownerId, caller);

    products.remove(productId);
  };

  public query ({ caller }) func getProduct(productId : Nat) : async Product {
    // Anyone can view products (including guests)
    getProductInternal(productId);
  };

  public query ({ caller }) func listProductsByStore(storeId : Nat) : async [Product] {
    // Anyone can view products (including guests)
    getProductsByStore(storeId);
  };

  public query ({ caller }) func listActiveProductsByStore(storeId : Nat) : async [Product] {
    // Anyone can view active products (including guests)
    getProductsByStore(storeId).filter(func(p : Product) : Bool { p.isActive });
  };

  // Order Management
  public shared ({ caller }) func placeOrder(storeId : Nat, buyerName : Text, buyerEmail : Text, items : [OrderItem]) : async Nat {
    // Anyone can place orders (including guests)
    let store = getStoreInternal(storeId);
    
    // Validate products and calculate total
    var totalPrice : Nat = 0;
    for (item in items.vals()) {
      let product = getProductInternal(item.productId);
      if (product.storeId != storeId) {
        Runtime.trap("Product does not belong to this store");
      };
      if (not product.isActive) {
        Runtime.trap("Product is not active");
      };
      if (product.stock < item.quantity) {
        Runtime.trap("Insufficient stock for product: " # product.name);
      };
      totalPrice += item.quantity * item.unitPrice;
    };

    let currentTime = Time.now();
    let orderId = orderIdCounter;
    orderIdCounter += 1;

    let buyerPrincipal = if (caller.isAnonymous()) { null } else { ?caller };

    let order : Order = {
      id = orderId;
      storeId;
      buyerName;
      buyerEmail;
      buyerPrincipal;
      items;
      totalPrice;
      status = #pending;
      createdAt = currentTime;
    };

    orders.add(orderId, order);

    // Update product stock
    for (item in items.vals()) {
      let product = getProductInternal(item.productId);
      let updatedProduct : Product = {
        product with
        stock = product.stock - item.quantity;
      };
      products.add(item.productId, updatedProduct);
    };

    orderId;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update order status");
    };
    let order = getOrderInternal(orderId);
    let store = getStoreInternal(order.storeId);
    assertStoreOwner(store.ownerId, caller);

    let updatedOrder : Order = {
      order with
      status;
    };

    orders.add(orderId, updatedOrder);
  };

  public query ({ caller }) func getOrder(orderId : Nat) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    let order = getOrderInternal(orderId);
    let store = getStoreInternal(order.storeId);
    
    // Only store owner can view the order
    assertStoreOwner(store.ownerId, caller);
    order;
  };

  public query ({ caller }) func listOrdersByStore(storeId : Nat) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view store orders");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);

    orders.values().toArray().filter(func(order : Order) : Bool { order.storeId == storeId });
  };

  public query ({ caller }) func listMyOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their orders");
    };
    orders.values().toArray().filter(func(order : Order) : Bool {
      switch (order.buyerPrincipal) {
        case (?principal) { principal == caller };
        case (null) { false };
      };
    });
  };

  // Analytics
  public query ({ caller }) func getStoreAnalytics(storeId : Nat) : async StoreAnalytics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view analytics");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);

    let storeOrders = orders.values().toArray().filter(func(order : Order) : Bool { order.storeId == storeId });
    
    var totalOrders : Nat = storeOrders.size();
    var totalRevenue : Nat = 0;
    let productSales = Map.empty<Nat, (Text, Nat)>();

    for (order in storeOrders.vals()) {
      totalRevenue += order.totalPrice;
      for (item in order.items.vals()) {
        switch (productSales.get(item.productId)) {
          case (?existing) {
            let (name, qty) = existing;
            productSales.add(item.productId, (name, qty + item.quantity));
          };
          case (null) {
            productSales.add(item.productId, (item.productName, item.quantity));
          };
        };
      };
    };

    // Get top 5 products
    let salesArray = productSales.entries().toArray();
    let sortedSales = salesArray.sort(func(a : (Nat, (Text, Nat)), b : (Nat, (Text, Nat))) : Order.Order {
      let (_, (_, qtyA)) = a;
      let (_, (_, qtyB)) = b;
      Nat.compare(qtyB, qtyA); // Descending order
    });

    let topProducts = Array.tabulate<(Nat, Text, Nat)>(
      Nat.min(5, sortedSales.size()),
      func(i : Nat) : (Nat, Text, Nat) {
        let (productId, (name, qty)) = sortedSales[i];
        (productId, name, qty);
      }
    );

    {
      totalOrders;
      totalRevenue;
      topProducts;
    };
  };

  // AI Assistant
  public shared ({ caller }) func aiAssist(context : Text, userPrompt : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use AI assistant");
    };
    // This would make an HTTP outcall to an AI API in a real implementation
    Debug.print("AI call not implemented. This would be implemented via HTTP outcalls.");
    "AI response for: " # userPrompt # " with context " # context;
  };

  // Helper Functions
  func assertStoreOwner(ownerId : Principal, caller : Principal) {
    if (ownerId != caller) {
      Runtime.trap("Unauthorized: Only store owner can perform this action");
    };
  };

  func getStoreInternal(storeId : Nat) : Store {
    switch (stores.get(storeId)) {
      case (?store) { store };
      case (null) { Runtime.trap("Store not found") };
    };
  };

  func getProductInternal(productId : Nat) : Product {
    switch (products.get(productId)) {
      case (?product) { product };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  func getOrderInternal(orderId : Nat) : Order {
    switch (orders.get(orderId)) {
      case (?order) { order };
      case (null) { Runtime.trap("Order not found") };
    };
  };

  func getProductsByStore(storeId : Nat) : [Product] {
    products.values().toArray().filter(func(product : Product) : Bool { product.storeId == storeId });
  };
};
