import React from "react";

const Cart: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-3xl font-semibold mb-0">Cart</h1>
      </div>

      <div className="chat-wrapper grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className=" col-span-12 md:col-span-8 xl:col-span-9">
          <div className="relative rounded-lg bg-white border-0 overflow-hidden flex flex-col">
            <div className="items-center px-6 py-4 active border-b border-neutral-200">
              <div className="flex flex-row items-center justify-between">
                <h2 className="text-2xl font-medium mb-0">Cart</h2>
              </div>
            </div>
            <div className="chat-message-list flex flex-col lg:flex-row p-6 gap-6"></div>
          </div>
        </div>

        <div className="rounded-lg bg-white overflow-hidden col-span-12 md:col-span-4 xl:col-span-3">
          <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-4">
            <div className="flex items-center gap-4">
              <div className="">
                <h2 className="text-lg font-bold mb-0">Summary</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
