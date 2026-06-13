import { Route, Routes } from "react-router-dom"
import AuthLayout from "./components/auth/layout"
import AuthLogin from "./pages/auth/login"
import AuthRegister from "./pages/auth/register"
import AdminLayout from "./components/admin-view/layout"
import AdminDashboard from "./pages/admin-view/dashboard"
import AdminFeatures from "./pages/admin-view/features"
import AdminProducts from "./pages/admin-view/products"
import AdminOrders from "./pages/admin-view/orders"
import ShoppingLayout from "./components/shopping-view/layout"
import NotFound from "./pages/not-found"
import ShoppingCheckout from "./pages/shopping-view/checkout"
import ShoppingListing from "./pages/shopping-view/listing"
import ShoppingHome from "./pages/shopping-view/home"
import ShoppingAccount from "./pages/shopping-view/account"
import UnauthPage from "./pages/unauth-page"
import CheckAuth from "./components/common/check-auth"
import PaymentSuccessPage from "./pages/shopping-view/payment-success";
import SearchProducts from "./pages/shopping-view/search";
import { useDispatch, useSelector } from "react-redux"
import { checkAuth } from "./store/auth-slice"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

function App() {
   const { user, isAuthenticated, isLoading } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) return <Skeleton className="h-[150px] w-full rounded-xl bg-gray-300 dark:bg-gray-700" />

  console.log(isLoading, user);

  return (
    <div className="flex flex-col overflow-hidden bg-white">
      
      <Routes>
        <Route
          path="/"
          element={
            <CheckAuth
              isAuthenticated={isAuthenticated}
              user={user}
            ></CheckAuth>
          }
        />
        <Route path="/auth" element={  
                    <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AuthLayout />
            </CheckAuth>
}>
          <Route path="login" element={<AuthLogin />}/>
          <Route path="register" element={<AuthRegister />}/>
        </Route>
        <Route path="/admin" element={<CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AdminLayout />
            </CheckAuth>}>
          <Route path="dashboard" element={<AdminDashboard/>}/>
          <Route path="features" element={<AdminFeatures/>}/>
          <Route path="products" element={<AdminProducts/>}/>
          <Route path="orders" element={<AdminOrders/>}/>
        </Route>
        <Route path="/shop" element = {<CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <ShoppingLayout />
            </CheckAuth>}>
          <Route path="checkout" element={<ShoppingCheckout/>}/>
          <Route path="listing" element={<ShoppingListing/>}/>
          <Route path="home" element={<ShoppingHome/>}/>
          <Route path="account" element={<ShoppingAccount/>}/>
          <Route path="payment-success" element={<PaymentSuccessPage />} />
          <Route path="search" element={<SearchProducts />} />
        </Route>
        <Route path="*" element={<NotFound/>}/>
        <Route path="unauth-page" element={<UnauthPage/>}/>
      </Routes>
    </div>
  )
}

export default App
