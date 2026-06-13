import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  orderId: null,
  orderList: [],
  orderDetails: null,
};

export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",

  async (orderData) => {

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/shop/order/create`,
      orderData
    );

    return response.data;
  }
);

export const capturePayment = createAsyncThunk(
  "/order/capturePayment",

  async ({
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    orderId,
  }) => {

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/shop/order/capture`,
      {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        orderId,
      }
    );

    return response.data;
  }
);

export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",

  async (userId) => {

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/shop/order/list/${userId}`
    );

    return response.data;
  }
);

export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",

  async (id) => {

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/shop/order/details/${id}`
    );

    return response.data;
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",

  initialState,

  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },

  extraReducers: (builder) => {

    builder

      // CREATE ORDER

      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;

        state.orderId = action.payload.orderId;

        sessionStorage.setItem(
          "currentOrderId",
          JSON.stringify(action.payload.orderId)
        );
      })

      .addCase(createNewOrder.rejected, (state) => {
        state.isLoading = false;

        state.orderId = null;
      })

      // CAPTURE PAYMENT

      .addCase(capturePayment.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(capturePayment.fulfilled, (state) => {
        state.isLoading = false;
      })

      .addCase(capturePayment.rejected, (state) => {
        state.isLoading = false;
      })

      // GET USER ORDERS

      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;

        state.orderList = action.payload.data;
      })

      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;

        state.orderList = [];
      })

      // GET ORDER DETAILS

      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;

        state.orderDetails = action.payload.data;
      })

      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading = false;

        state.orderDetails = null;
      });
  },
});

export const {
  resetOrderDetails,
} = shoppingOrderSlice.actions;

export default shoppingOrderSlice.reducer;