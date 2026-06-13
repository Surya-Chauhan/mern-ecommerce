import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";

import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder, capturePayment } from "@/store/shop/order-slice";
import { toast } from "sonner";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);

  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymentStart] = useState(false);

  const dispatch = useDispatch();

  const resetPaymentState = () => {
    setIsPaymentStart(false);
  };

  const totalCartAmount =
    cartItems?.items?.length > 0
      ? cartItems.items.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

  async function handleInitiateRazorpayPayment() {
    // CART CHECK
    if (!cartItems?.items?.length) {
      toast.error("Your cart is empty. Please add items to proceed");
      return;
    }

    // ADDRESS CHECK
    if (!currentSelectedAddress) {
      toast.error("Please select an address to proceed.");
      return;
    }

    setIsPaymentStart(true);

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,

      cartItems: cartItems.items.map((item) => ({
        productId: item?.productId,
        title: item?.title,
        image: item?.image,
        price:
          item?.salePrice > 0 ? item?.salePrice : item?.price,
        quantity: item?.quantity,
      })),

      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },

      orderStatus: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
      paymentId: "",
      payerId: "",
    };

    try {
      // CREATE ORDER
      const response = await dispatch(createNewOrder(orderData));
      const data = response?.payload;

      console.log(data);

      if (!data?.success) {
        resetPaymentState();
        toast.error("Order creation failed");
        return;
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "E-Commerce",
        description: "Order Payment",
        order_id: data.razorpayOrderId,

        handler: async function (response) {
          try {
            const result = await dispatch(
              capturePayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderId: data.orderId,
              })
            );

            if (result?.payload?.success) {
              toast.success("Payment successful");

              sessionStorage.removeItem("currentOrderId");
              window.location.href = "/shop/payment-success";
            } else {
              toast.error("Payment verification failed");
            }
          } catch (err) {
            console.log(err);
            toast.error("Payment verification error");
          } finally {
            resetPaymentState();
          }
        },

        modal: {
          ondismiss: function () {
            resetPaymentState();
          },
        },

        prefill: {
          name: user?.userName,
          email: user?.email,
        },

        theme: {
          color: "#000000",
        },
      };

      const razorpay = new window.Razorpay(options);

      let paymentFailedHandled = false;

      razorpay.on("payment.failed", function (response) {
        if (paymentFailedHandled) return;

        paymentFailedHandled = true;

        console.log(response);
        toast.error(
          response?.error?.description || "Payment failed"
        );

        resetPaymentState();
      });

      razorpay.open(); // ✅ ONLY ONCE
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
      resetPaymentState();
    }
  }

  return (
    <div className="flex flex-col">
      {/* BANNER */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img
          src={img}
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        {/* ADDRESS */}
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />

        {/* CART */}
        <div className="flex flex-col gap-4">
          {cartItems?.items?.map((item) => (
            <UserCartItemsContent
              key={item.productId}
              cartItem={item}
            />
          ))}

          {/* TOTAL */}
          <div className="mt-8 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold">₹{totalCartAmount}</span>
          </div>

          {/* BUTTON */}
          <Button
            disabled={isPaymentStart}
            onClick={handleInitiateRazorpayPayment}
            className="w-full mt-4"
          >
            {isPaymentStart
              ? "Processing Payment..."
              : "Checkout with Razorpay"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;