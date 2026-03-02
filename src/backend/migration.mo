import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldStore = {
    id : Nat;
    ownerId : Principal;
    name : Text;
    slug : Text;
    description : Text;
    bannerImageId : ?Blob;
    isActive : Bool;
    createdAt : Int;
  };

  type OldProduct = {
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

  type OldOrder = {
    id : Nat;
    storeId : Nat;
    buyerName : Text;
    buyerEmail : Text;
    buyerPrincipal : ?Principal;
    items : [OldOrderItem];
    totalPrice : Nat;
    status : OldOrderStatus;
    createdAt : Time.Time;
  };

  type OldOrderItem = {
    productId : Nat;
    productName : Text;
    quantity : Nat;
    unitPrice : Nat;
  };

  type OldOrderStatus = {
    #pending;
    #fulfilled;
    #cancelled;
  };

  type NewProduct = {
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

  type NewOrder = {
    id : Nat;
    storeId : Nat;
    buyerName : Text;
    buyerEmail : Text;
    buyerPrincipal : ?Principal;
    items : [OldOrderItem];
    totalPrice : Nat;
    status : OldOrderStatus;
    createdAt : Time.Time;
  };

  type OldActor = {
    stores : Map.Map<Nat, OldStore>;
    products : Map.Map<Nat, OldProduct>;
    orders : Map.Map<Nat, OldOrder>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    storeIdCounter : Nat;
    productIdCounter : Nat;
    orderIdCounter : Nat;
  };

  type NewActor = {
    stores : Map.Map<Nat, OldStore>;
    products : Map.Map<Nat, NewProduct>;
    orders : Map.Map<Nat, NewOrder>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    storeIdCounter : Nat;
    productIdCounter : Nat;
    orderIdCounter : Nat;
    memberships : Map.Map<Nat, { id : Nat; storeId : Nat; name : Text; description : Text; price : Nat; durationDays : Nat; perks : [Text]; isActive : Bool; createdAt : Int }>;
    storePaymentInfos : Map.Map<Nat, { storeId : Nat; paypalEmail : ?Text; paypalUsername : ?Text; bankName : ?Text; accountNumber : ?Text; sortCode : ?Text; stripeAccountId : ?Text; enabledChannels : [Text] }>;
    membershipIdCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, NewProduct>(
      func(_, oldProduct) {
        {
          oldProduct with
          mediaIds = null;
        };
      }
    );
    {
      stores = old.stores;
      products = newProducts;
      orders = old.orders;
      userProfiles = old.userProfiles;
      storeIdCounter = old.storeIdCounter;
      productIdCounter = old.productIdCounter;
      orderIdCounter = old.orderIdCounter;
      memberships = Map.empty<Nat, { id : Nat; storeId : Nat; name : Text; description : Text; price : Nat; durationDays : Nat; perks : [Text]; isActive : Bool; createdAt : Int }>();
      storePaymentInfos = Map.empty<Nat, { storeId : Nat; paypalEmail : ?Text; paypalUsername : ?Text; bankName : ?Text; accountNumber : ?Text; sortCode : ?Text; stripeAccountId : ?Text; enabledChannels : [Text] }>();
      membershipIdCounter = 0;
    };
  };
};
