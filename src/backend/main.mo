import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import List "mo:core/List";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  public type Store = {
    id : Nat;
    ownerId : Principal;
    name : Text;
    slug : Text;
    description : Text;
    bannerImageId : ?Blob;
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type StoreMembership = {
    id : Nat;
    storeId : Nat;
    name : Text;
    description : Text;
    price : Nat;
    durationDays : Nat;
    perks : [Text];
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type Product = {
    id : Nat;
    storeId : Nat;
    name : Text;
    description : Text;
    price : Nat;
    stock : Nat;
    category : Text;
    imageId : ?Blob;
    mediaIds : ?[Blob];
    isActive : Bool;
    createdAt : Time.Time;
  };

  public type Order = {
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

  public type OrderItem = {
    productId : Nat;
    productName : Text;
    quantity : Nat;
    unitPrice : Nat;
  };

  public type OrderStatus = {
    #pending;
    #fulfilled;
    #cancelled;
  };

  public type StoreAnalytics = {
    totalOrders : Nat;
    totalRevenue : Nat;
    topProducts : [(Nat, Text, Nat)];
  };

  public type StorePaymentInfo = {
    storeId : Nat;
    paypalEmail : ?Text;
    paypalUsername : ?Text;
    bankName : ?Text;
    accountNumber : ?Text;
    sortCode : ?Text;
    stripeAccountId : ?Text;
    enabledChannels : [Text];
  };

  var storeIdCounter = 0;
  var productIdCounter = 0;
  var orderIdCounter = 0;
  var membershipIdCounter = 0;

  let stores = Map.empty<Nat, Store>();
  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let memberships = Map.empty<Nat, StoreMembership>();
  let storePaymentInfos = Map.empty<Nat, StorePaymentInfo>();

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
    getStoreInternal(storeId);
  };

  public query ({ caller }) func getStoreBySlug(slug : Text) : async Store {
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
    stores.values().toArray();
  };

  public shared ({ caller }) func deleteStore(storeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete stores");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);
    stores.remove(storeId);
  };

  public shared ({ caller }) func addStoreMembership(storeId : Nat, name : Text, description : Text, price : Nat, durationDays : Nat, perks : [Text]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add memberships");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);

    let membershipId = membershipIdCounter;
    membershipIdCounter += 1;

    let membership : StoreMembership = {
      id = membershipId;
      storeId;
      name;
      description;
      price;
      durationDays;
      perks;
      isActive = true;
      createdAt = Time.now();
    };

    memberships.add(membershipId, membership);
    membershipId;
  };

  public shared ({ caller }) func updateStoreMembership(membershipId : Nat, name : Text, description : Text, price : Nat, durationDays : Nat, perks : [Text], isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update memberships");
    };
    let membership = getMembershipInternal(membershipId);
    let store = getStoreInternal(membership.storeId);
    assertStoreOwner(store.ownerId, caller);

    let updatedMembership : StoreMembership = {
      membership with
      name;
      description;
      price;
      durationDays;
      perks;
      isActive;
    };

    memberships.add(membershipId, updatedMembership);
  };

  public shared ({ caller }) func deleteStoreMembership(membershipId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete memberships");
    };
    let membership = getMembershipInternal(membershipId);
    let store = getStoreInternal(membership.storeId);
    assertStoreOwner(store.ownerId, caller);
    memberships.remove(membershipId);
  };

  public query ({ caller }) func getStoreMembership(membershipId : Nat) : async StoreMembership {
    getMembershipInternal(membershipId);
  };

  public query ({ caller }) func listMembershipsByStore(storeId : Nat) : async [StoreMembership] {
    memberships.values().toArray().filter(func(m) { m.storeId == storeId });
  };

  func getMembershipInternal(membershipId : Nat) : StoreMembership {
    switch (memberships.get(membershipId)) {
      case (?membership) { membership };
      case (null) { Runtime.trap("Membership not found") };
    };
  };

  public shared ({ caller }) func saveStorePaymentInfo(storeId : Nat, info : StorePaymentInfo) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save payment info");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);
    storePaymentInfos.add(storeId, info);
  };

  public query ({ caller }) func getStorePaymentInfo(storeId : Nat) : async ?StorePaymentInfo {
    storePaymentInfos.get(storeId);
  };

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
      mediaIds = null;
      isActive = true;
      createdAt = currentTime;
    };

    products.add(productId, product);
    productId;
  };

  public shared ({ caller }) func updateProduct(productId : Nat, name : Text, description : Text, price : Nat, stock : Nat, mediaIds : ?[Blob]) : async () {
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
      mediaIds;
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
    getProductInternal(productId);
  };

  public query ({ caller }) func listProductsByStore(storeId : Nat) : async [Product] {
    getProductsByStore(storeId);
  };

  public query ({ caller }) func listActiveProductsByStore(storeId : Nat) : async [Product] {
    getProductsByStore(storeId).filter(func(p : Product) : Bool { p.isActive });
  };

  public shared ({ caller }) func placeOrder(storeId : Nat, buyerName : Text, buyerEmail : Text, items : [OrderItem]) : async Nat {
    let store = getStoreInternal(storeId);
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
    assertStoreOwner(store.ownerId, caller);
    order;
  };

  public query ({ caller }) func listOrdersByStore(storeId : Nat) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list orders");
    };
    let store = getStoreInternal(storeId);
    assertStoreOwner(store.ownerId, caller);

    orders.values().toArray().filter(func(order : Order) : Bool { order.storeId == storeId });
  };

  public query ({ caller }) func listMyOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list their orders");
    };
    orders.values().toArray().filter(func(order : Order) : Bool {
      switch (order.buyerPrincipal) {
        case (?principal) { principal == caller };
        case (null) { false };
      };
    });
  };

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

    let salesArray = productSales.entries().toArray();
    let sortedSales = salesArray.sort(
      func(a, b) {
        let (_, (_, qtyA)) = a;
        let (_, (_, qtyB)) = b;
        Nat.compare(qtyB, qtyA);
      }
    );

    let topProducts = Array.tabulate(
      Nat.min(5, sortedSales.size()),
      func(i) {
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
