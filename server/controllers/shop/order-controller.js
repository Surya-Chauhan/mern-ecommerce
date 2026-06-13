const crypto = require("crypto");

const razorpay = require("../../helpers/razorpay");

const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

const createOrder = async (req, res) => {
  try {

    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    // CREATE RAZORPAY ORDER

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder =
      await razorpay.orders.create(options);

    // SAVE ORDER IN DB

    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,

      paymentId: "",
      payerId: "",
    });

    await newlyCreatedOrder.save();

    // SEND RESPONSE TO FRONTEND

    res.status(201).json({
      success: true,

      orderId: newlyCreatedOrder._id,

      razorpayOrderId: razorpayOrder.id,

      amount: razorpayOrder.amount,

      currency: razorpayOrder.currency,

      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (e) {

    console.log(e);

    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const capturePayment = async (req, res) => {
  try {

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // FIND ORDER

    let order = await Order.findById(orderId);

    if (!order) {

      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    // PREVENT DUPLICATE PAYMENT

    if (order.paymentStatus === "paid") {

      return res.status(400).json({
        success: false,
        message: "Payment already verified",
      });
    }

    // SIGNATURE VERIFICATION

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body.toString())
      .digest("hex");

    const isAuthentic =
      expectedSignature === razorpay_signature;

    // PAYMENT FAILED

    if (!isAuthentic) {

      order.paymentStatus = "failed";

      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // PAYMENT SUCCESS

    order.paymentStatus = "paid";

    order.orderStatus = "confirmed";

    order.paymentId = razorpay_payment_id;

    order.payerId = razorpay_order_id;

    // UPDATE STOCK

    for (let item of order.cartItems) {

      let product = await Product.findById(
        item.productId
      );

      if (!product) {

        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      product.totalStock -= item.quantity;

      await product.save();
    }

    // DELETE CART

    await Cart.findByIdAndDelete(order.cartId);

    // SAVE ORDER

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });

  } catch (e) {

    console.log(e);

    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {

    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {

      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (e) {

    console.log(e);

    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {

    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {

      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });

  } catch (e) {

    console.log(e);

    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};