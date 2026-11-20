'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Download,
  FileText,
  Gauge,
  Heart,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
  User,
  X,
} from 'lucide-react';
import { formatMoney } from '@/lib/store-logic';
import { useStore } from '@/context/StoreContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import type { Order } from '@/lib/types';

type AccountTab =
  | 'dashboard'
  | 'orders'
  | 'prescriptions'
  | 'subscriptions'
  | 'downloads'
  | 'addresses'
  | 'details'
  | 'compare'
  | 'wishlist';

function AccountPageInner() {
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get('tab') as AccountTab | null) ?? 'orders';

  const {
    products,
    user,
    openAuthModal,
    logout,
    updateUserProfile,
    currency,
    orders,
    payOrder,
    cancelOrder,
    rxRequests,
    setRxPreviewFile,
    subscriptions,
    updateSubscription,
    setHistoryModalSub,
    wishlistIds,
    compareIds,
    toggleCompare,
    showToast,
  } = useStore();

  const [clickedTab, setClickedTab] = useState<{ param: AccountTab; tab: AccountTab } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draftProfile, setDraftProfile] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const activeTab: AccountTab =
    clickedTab && clickedTab.param === tabParam ? clickedTab.tab : tabParam;
  const setActiveTab = (tab: AccountTab) => setClickedTab({ param: tabParam, tab });

  const editName = draftProfile.name ?? user?.name ?? '';
  const editEmail = draftProfile.email ?? user?.email ?? '';
  const editPhone = draftProfile.phone ?? user?.phone ?? '';

  const navItems: { id: AccountTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Gauge className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'prescriptions', label: 'Prescription Orders', icon: <FileText className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Medicine Subscriptions', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'downloads', label: 'Downloads', icon: <Download className="w-4 h-4" /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
    { id: 'details', label: 'Account details', icon: <Pencil className="w-4 h-4" /> },
    { id: 'compare', label: 'Compare', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
  ];

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));
  const compareProducts = products.filter((p) => compareIds.includes(p.id));

  // Allow Wishlist & Compare browsing even if logged out, gate Orders/Rx/Subscriptions cleanly
  const requiresAuth =
    activeTab !== 'wishlist' && activeTab !== 'compare';

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'My account' },
        ]}
        title="My Account"
      />

      <section className="max-w-[1320px] mx-auto px-4 py-6 pb-16">
        {!user && requiresAuth ? (
          <div className="max-w-lg mx-auto bg-[#FAF8FC] border border-purple-100 rounded-2xl p-10 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-[#DC3545] flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#082A66]">Shopify Member Sign In Required</h2>
            <p className="text-xs text-slate-600">
              Sign in with your Xmedcar Shopify account to access orders, prescription approvals, and medicine subscription schedules.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal('signin')}
              className="px-8 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
            >
              Login / Register
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Shared Account Sidebar (Screens 17–20) */}
            <aside className="lg:col-span-3 bg-[#FAF8FC] rounded-2xl p-5">
              <div className="flex flex-col items-center text-center pb-5 mb-4 border-b border-slate-200/70">
                <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mb-3">
                  <User className="w-10 h-10" />
                </div>
                <p className="text-base font-bold text-[#082A66]">{user?.name ?? 'Guest'}</p>
              </div>

              <nav aria-label="Account navigation" className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#082A66] shadow-xs'
                          : 'text-[#082A66]/80 hover:bg-white/60 hover:text-[#7B3CA1]'
                      }`}
                    >
                      <span className="text-slate-500">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                {user && (
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#082A66]/80 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-slate-500" />
                    <span>Log out</span>
                  </button>
                )}
              </nav>
            </aside>

            {/* Right Content Area */}
            <div className="lg:col-span-9 min-w-0">
              {/* DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#082A66]">
                    Welcome back, {user?.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-left border border-slate-200 hover:border-[#7B3CA1] rounded-2xl p-5 cursor-pointer"
                    >
                      <p className="text-xs text-slate-500">Total Orders</p>
                      <p className="text-3xl font-extrabold text-[#082A66] mt-1 tabular-nums">
                        {orders.length}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('prescriptions')}
                      className="text-left border border-slate-200 hover:border-[#7B3CA1] rounded-2xl p-5 cursor-pointer"
                    >
                      <p className="text-xs text-slate-500">Prescription Requests</p>
                      <p className="text-3xl font-extrabold text-[#7B3CA1] mt-1 tabular-nums">
                        {rxRequests.length}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('subscriptions')}
                      className="text-left border border-slate-200 hover:border-[#7B3CA1] rounded-2xl p-5 cursor-pointer"
                    >
                      <p className="text-xs text-slate-500">Active Subscriptions</p>
                      <p className="text-3xl font-extrabold text-emerald-600 mt-1 tabular-nums">
                        {subscriptions.filter((s) => s.status === 'ACTIVE').length}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 17: MY ORDERS */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#082A66] mb-1">My Orders</h2>
                  <p className="text-xs text-slate-500 mb-6">
                    Your recent orders are displayed in the table below.
                  </p>

                  {orders.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8">No orders placed yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[600px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-sm font-bold text-[#082A66]">
                            <th className="py-3 pr-4">Order</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Total</th>
                            <th className="py-3 pl-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orders.map((ord) => {
                            const itemCount = ord.items.reduce((s, i) => s + i.quantity, 0);
                            return (
                              <tr key={ord.id}>
                                <td className="py-5 pr-4 font-bold text-[#082A66]">{ord.number}</td>
                                <td className="py-5 px-4 text-slate-600">{ord.date}</td>
                                <td className="py-5 px-4 text-slate-700 font-medium">{ord.status}</td>
                                <td className="py-5 px-4 text-slate-700 tabular-nums">
                                  <strong className="text-[#082A66]">
                                    {formatMoney(ord.total, currency)}
                                  </strong>{' '}
                                  for {itemCount} item{itemCount === 1 ? '' : 's'}
                                </td>
                                <td className="py-5 pl-4">
                                  <div className="flex flex-col gap-2 w-28">
                                    {ord.status === 'Pending payment' && (
                                      <button
                                        type="button"
                                        onClick={() => payOrder(ord.id)}
                                        className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                                      >
                                        Pay
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrder(ord)}
                                      className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                                    >
                                      View
                                    </button>
                                    {(ord.status === 'Pending payment' || ord.status === 'Processing') && (
                                      <button
                                        type="button"
                                        onClick={() => cancelOrder(ord.id)}
                                        className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SCREEN 18: MY PRESCRIPTION ORDERS */}
              {activeTab === 'prescriptions' && (
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#082A66] mb-1">
                        My Prescription Orders
                      </h2>
                      <p className="text-xs text-slate-500">
                        Your recent prescription orders requests are displayed in the table below.
                      </p>
                    </div>
                    <Link
                      href="/order-prescription"
                      className="px-4 py-2 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold whitespace-nowrap"
                    >
                      + Upload New Rx
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[560px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm font-bold text-[#082A66]">
                          <th className="py-3 pr-4">Request ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 pl-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rxRequests.map((req) => (
                          <tr key={req.id}>
                            <td className="py-5 pr-4 font-bold text-[#082A66]">
                              {req.requestNumber}
                            </td>
                            <td className="py-5 px-4 text-slate-600">{req.date}</td>
                            <td className="py-5 px-4">
                              <span className="inline-block bg-[#F5F0FA] text-[#7B3CA1] font-semibold px-2.5 py-1 rounded text-[11px]">
                                {req.status}
                              </span>
                            </td>
                            <td className="py-5 pl-4">
                              <div className="flex flex-col gap-2 w-32">
                                {req.status === 'Converted' && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('orders')}
                                    className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                                  >
                                    View Order
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setRxPreviewFile(req.file)}
                                  className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                                >
                                  View File
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SCREEN 19: MY MEDICINE SUBSCRIPTIONS */}
              {activeTab === 'subscriptions' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#082A66] mb-1">
                    My Medicine Subscriptions
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">
                    Your recent medicine subscriptions are displayed in the table below.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[680px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm font-bold text-[#082A66]">
                          <th className="py-3 pr-4">Medicine</th>
                          <th className="py-3 px-3">Interval</th>
                          <th className="py-3 px-3">Qty</th>
                          <th className="py-3 px-3">Price / Cycle</th>
                          <th className="py-3 px-3">Next Renewal</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 pl-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscriptions.map((sub) => (
                          <tr key={sub.id}>
                            <td className="py-5 pr-4 font-bold text-[#082A66] max-w-[180px]">
                              {sub.productName}
                            </td>
                            <td className="py-5 px-3">
                              <select
                                aria-label={`Delivery interval for ${sub.productName}`}
                                value={sub.intervalDays}
                                disabled={sub.status === 'CANCELLED'}
                                onChange={(e) =>
                                  updateSubscription(sub.id, {
                                    type: 'interval',
                                    days: Number(e.target.value) as 30 | 60 | 90,
                                  })
                                }
                                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#082A66]"
                              >
                                <option value={30}>30 Days</option>
                                <option value={60}>60 Days</option>
                                <option value={90}>90 Days</option>
                              </select>
                            </td>
                            <td className="py-5 px-3 tabular-nums text-slate-700">
                              {sub.quantity}
                            </td>
                            <td className="py-5 px-3 font-bold text-[#082A66] tabular-nums">
                              {formatMoney(sub.pricePerCycle, currency)}
                            </td>
                            <td className="py-5 px-3 text-slate-600">{sub.nextRenewal}</td>
                            <td className="py-5 px-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                                  sub.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : sub.status === 'PAUSED'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-5 pl-3">
                              <div className="flex flex-col gap-2 w-28">
                                {sub.status === 'ACTIVE' && (
                                  <button
                                    type="button"
                                    onClick={() => updateSubscription(sub.id, 'pause')}
                                    className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Pause
                                  </button>
                                )}
                                {sub.status === 'PAUSED' && (
                                  <button
                                    type="button"
                                    onClick={() => updateSubscription(sub.id, 'resume')}
                                    className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Resume
                                  </button>
                                )}
                                {sub.status !== 'CANCELLED' && (
                                  <button
                                    type="button"
                                    onClick={() => updateSubscription(sub.id, 'cancel')}
                                    className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setHistoryModalSub(sub)}
                                  className="w-full py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                                >
                                  History
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DOWNLOADS */}
              {activeTab === 'downloads' && (
                <div className="border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                  <h2 className="text-lg font-bold text-[#082A66]">Pharmacy Receipts &amp; Guides</h2>
                  <p className="text-xs text-slate-500">
                    Your itemized order invoices and medication guides appear here after fulfillment.
                  </p>
                </div>
              )}

              {/* ADDRESSES */}
              {activeTab === 'addresses' && user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-slate-200 rounded-2xl p-6 space-y-2">
                    <h3 className="text-base font-bold text-[#082A66]">Billing Address</h3>
                    <p className="text-xs text-slate-600">
                      {user.billingAddress.firstName} {user.billingAddress.lastName}
                    </p>
                    <p className="text-xs text-slate-600">
                      {user.billingAddress.street1} {user.billingAddress.street2}
                    </p>
                    <p className="text-xs text-slate-600">
                      {user.billingAddress.city}, {user.billingAddress.state}{' '}
                      {user.billingAddress.zip}
                    </p>
                    <p className="text-xs text-slate-600">{user.billingAddress.country}</p>
                  </div>
                  <div className="border border-slate-200 rounded-2xl p-6 space-y-2">
                    <h3 className="text-base font-bold text-[#082A66]">Shipping Address</h3>
                    <p className="text-xs text-slate-600">
                      Same as billing address ({user.billingAddress.city},{' '}
                      {user.billingAddress.state}).
                    </p>
                  </div>
                </div>
              )}

              {/* ACCOUNT DETAILS */}
              {activeTab === 'details' && user && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await updateUserProfile({ name: editName, email: editEmail, phone: editPhone });
                  }}
                  className="max-w-lg space-y-4"
                >
                  <h2 className="text-2xl font-bold text-[#082A66]">Account Details</h2>
                  <div>
                    <label htmlFor="acc-name" className="block text-xs font-semibold text-[#082A66] mb-1">
                      Display Name
                    </label>
                    <input
                      id="acc-name"
                      type="text"
                      value={editName}
                      onChange={(e) =>
                        setDraftProfile((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="acc-email" className="block text-xs font-semibold text-[#082A66] mb-1">
                      Email Address
                    </label>
                    <input
                      id="acc-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) =>
                        setDraftProfile((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="acc-phone" className="block text-xs font-semibold text-[#082A66] mb-1">
                      Phone Number
                    </label>
                    <input
                      id="acc-phone"
                      type="tel"
                      value={editPhone}
                      onChange={(e) =>
                        setDraftProfile((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </form>
              )}

              {/* WISHLIST */}
              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#082A66] mb-4">My Wishlist</h2>
                  {wishlistProducts.length === 0 ? (
                    <p className="text-sm text-slate-500">Your wishlist is empty.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {wishlistProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* COMPARE */}
              {activeTab === 'compare' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#082A66] mb-4">Compare Medicines</h2>
                  {compareProducts.length === 0 ? (
                    <p className="text-sm text-slate-500">No products selected for comparison.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                        <thead>
                          <tr className="border-b border-slate-200 bg-[#F8F9FC]">
                            <th className="p-4 font-bold text-[#082A66]">Attribute</th>
                            {compareProducts.map((p) => (
                              <th key={p.id} className="p-4 font-bold text-[#082A66]">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{p.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleCompare(p.id)}
                                    className="text-slate-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-4 font-semibold text-slate-500">Price</td>
                            {compareProducts.map((p) => (
                              <td key={p.id} className="p-4 font-bold text-[#7B3CA1] tabular-nums">
                                {formatMoney(p.price, currency)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-4 font-semibold text-slate-500">Composition</td>
                            {compareProducts.map((p) => (
                              <td key={p.id} className="p-4 text-slate-700">{p.composition}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-4 font-semibold text-slate-500">Prescription Required</td>
                            {compareProducts.map((p) => (
                              <td key={p.id} className="p-4">{p.isRx ? 'Yes (Rx)' : 'No (OTC)'}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-4 font-semibold text-slate-500">Manufacturer</td>
                            {compareProducts.map((p) => (
                              <td key={p.id} className="p-4">{p.manufacturer}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Order Detail Modal (Screen 17 View Action) */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Order ${selectedOrder.number} details`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#082A66]">
                Order {selectedOrder.number} Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Date:</strong> {selectedOrder.date} · <strong>Status:</strong>{' '}
                {selectedOrder.status}
              </p>
              <p>
                <strong>Shipping To:</strong> {selectedOrder.shippingAddress}
              </p>
              <p>
                <strong>Payment:</strong> {selectedOrder.paymentMethod}
              </p>
            </div>
            <div className="divide-y divide-slate-100 border-y border-slate-200">
              {selectedOrder.items.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#082A66]">
                    {it.name} × {it.quantity}
                  </span>
                  <span className="font-bold text-[#082A66] tabular-nums">
                    {formatMoney(it.price * it.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-[#082A66]">
              <span>Order Total</span>
              <span className="tabular-nums">{formatMoney(selectedOrder.total, currency)}</span>
            </div>
            {selectedOrder.status === 'Pending payment' && (
              <button
                type="button"
                onClick={() => {
                  payOrder(selectedOrder.id);
                  setSelectedOrder(null);
                  showToast(`Order ${selectedOrder.number} paid!`);
                }}
                className="w-full py-2.5 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold cursor-pointer"
              >
                Pay Now
              </button>
            )}
            {selectedOrder.shopifyOrderUrl && (
              <a
                href={selectedOrder.shopifyOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-[#082A66] text-xs font-semibold"
              >
                View on Shopify
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="max-w-[1320px] mx-auto px-4 py-12 text-sm text-slate-500">Loading account...</div>}>
      <AccountPageInner />
    </Suspense>
  );
}
