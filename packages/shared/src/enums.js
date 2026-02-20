"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackStatus = exports.FeedbackType = exports.InvoiceItemType = exports.SubscriptionVariant = exports.InvoiceStatus = exports.InvoiceType = exports.InvoiceOrderMode = exports.PaymentStatus = exports.PaymentProvider = exports.Role = exports.OrderType = exports.OrderStatus = exports.Segment = exports.ServiceType = void 0;
var ServiceType;
(function (ServiceType) {
    ServiceType["WASH_FOLD"] = "WASH_FOLD";
    ServiceType["WASH_IRON"] = "WASH_IRON";
    ServiceType["STEAM_IRON"] = "STEAM_IRON";
    ServiceType["DRY_CLEAN"] = "DRY_CLEAN";
    ServiceType["HOME_LINEN"] = "HOME_LINEN";
    ServiceType["SHOES"] = "SHOES";
    ServiceType["ADD_ONS"] = "ADD_ONS";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var Segment;
(function (Segment) {
    Segment["MEN"] = "MEN";
    Segment["WOMEN"] = "WOMEN";
    Segment["KIDS"] = "KIDS";
    Segment["HOME_LINEN"] = "HOME_LINEN";
})(Segment || (exports.Segment = Segment = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["BOOKING_CONFIRMED"] = "BOOKING_CONFIRMED";
    OrderStatus["PICKUP_SCHEDULED"] = "PICKUP_SCHEDULED";
    OrderStatus["PICKED_UP"] = "PICKED_UP";
    OrderStatus["IN_PROCESSING"] = "IN_PROCESSING";
    OrderStatus["READY"] = "READY";
    OrderStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["INDIVIDUAL"] = "INDIVIDUAL";
    OrderType["SUBSCRIPTION"] = "SUBSCRIPTION";
})(OrderType || (exports.OrderType = OrderType = {}));
var Role;
(function (Role) {
    Role["CUSTOMER"] = "CUSTOMER";
    Role["ADMIN"] = "ADMIN";
    Role["OPS"] = "OPS";
    Role["BILLING"] = "BILLING";
})(Role || (exports.Role = Role = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["RAZORPAY"] = "RAZORPAY";
    PaymentProvider["CASH"] = "CASH";
    PaymentProvider["UPI"] = "UPI";
    PaymentProvider["NONE"] = "NONE";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["CAPTURED"] = "CAPTURED";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var InvoiceOrderMode;
(function (InvoiceOrderMode) {
    InvoiceOrderMode["INDIVIDUAL"] = "INDIVIDUAL";
    InvoiceOrderMode["SUBSCRIPTION_ONLY"] = "SUBSCRIPTION_ONLY";
    InvoiceOrderMode["BOTH"] = "BOTH";
})(InvoiceOrderMode || (exports.InvoiceOrderMode = InvoiceOrderMode = {}));
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["ACKNOWLEDGEMENT"] = "ACKNOWLEDGEMENT";
    InvoiceType["FINAL"] = "FINAL";
    InvoiceType["SUBSCRIPTION"] = "SUBSCRIPTION";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["ISSUED"] = "ISSUED";
    InvoiceStatus["VOID"] = "VOID";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var SubscriptionVariant;
(function (SubscriptionVariant) {
    SubscriptionVariant["SINGLE"] = "SINGLE";
    SubscriptionVariant["COUPLE"] = "COUPLE";
    SubscriptionVariant["FAMILY"] = "FAMILY";
})(SubscriptionVariant || (exports.SubscriptionVariant = SubscriptionVariant = {}));
var InvoiceItemType;
(function (InvoiceItemType) {
    InvoiceItemType["SERVICE"] = "SERVICE";
    InvoiceItemType["DRYCLEAN_ITEM"] = "DRYCLEAN_ITEM";
    InvoiceItemType["ADDON"] = "ADDON";
    InvoiceItemType["FEE"] = "FEE";
    InvoiceItemType["DISCOUNT"] = "DISCOUNT";
})(InvoiceItemType || (exports.InvoiceItemType = InvoiceItemType = {}));
var FeedbackType;
(function (FeedbackType) {
    FeedbackType["ORDER"] = "ORDER";
    FeedbackType["GENERAL"] = "GENERAL";
})(FeedbackType || (exports.FeedbackType = FeedbackType = {}));
var FeedbackStatus;
(function (FeedbackStatus) {
    FeedbackStatus["NEW"] = "NEW";
    FeedbackStatus["REVIEWED"] = "REVIEWED";
    FeedbackStatus["RESOLVED"] = "RESOLVED";
})(FeedbackStatus || (exports.FeedbackStatus = FeedbackStatus = {}));
//# sourceMappingURL=enums.js.map