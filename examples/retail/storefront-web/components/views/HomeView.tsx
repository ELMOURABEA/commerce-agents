// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useEffect, useState } from "react";
import {
  ArrivingPanel,
  estimateOf,
  Greeting,
  greeting,
  HomeSection,
  type Order,
  plural,
  type Starter,
  Starters,
  upcoming,
  useCatalogIndex,
  useStoreFrame,
} from "web-shared";
import { fetchProducts } from "@/lib/api";
import { NOUNS, OrderThumb } from "@/lib/orders";
import type { Product } from "@/lib/types";
import ProductTile from "../ProductTile";

const STARTERS: Starter[] = [
  { icon: "search", prompt: "A tent for a first family camping trip, under $250" },
  { icon: "home", prompt: "Set up a home office in a small spare room for about $800" },
  { icon: "tag", prompt: "Drip or espresso for busy weekday mornings?" },
  { icon: "edit", prompt: "Remember: small apartment, no outdoor storage, and a golden retriever" },
];

/** What the store is featuring: labelled bestseller or new, photographed ones first. */
function featured(catalog: Record<string, Product>): Product[] {
  return Object.values(catalog)
    .filter((product) => product.labels?.some((label) => label === "bestseller" || label === "new") && product.in_stock !== false)
    .sort((a, b) => Number(Boolean(b.image_url)) - Number(Boolean(a.image_url)))
    .slice(0, 4);
}

function Brief({ orders }: { orders: Order[] | null }) {
  if (!orders) return <>Ask about a product, a project, an order, or a return.</>;
  const open = upcoming(orders);
  if (!open.length) return <>Nothing on the way right now. Ask about a product, a project, or a return.</>;
  const late = open.filter((order) => order.status === "delayed");
  const next = estimateOf(open.find((order) => order.status !== "delayed") ?? open[0])?.date;
  return (
    <>
      {plural(open.length, "order")} on the way{next ? `; the next arrives ${next}` : ""}.{" "}
      {late.length ? <span className="font-semibold text-(--warn)">{late.length === 1 ? "One is" : `${late.length} are`} running late.</span> : null}
    </>
  );
}

/** The clock is read after mount, so the prerendered page never disagrees with the browser's day. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

export default function HomeView({
  shopperName,
  orders,
  ordersFailed,
  onSeeOrders,
}: {
  shopperName: string;
  orders: Order[] | null;
  ordersFailed: boolean;
  onSeeOrders: () => void;
}) {
  const { ask } = useStoreFrame();
  const catalog = useCatalogIndex(fetchProducts);
  const picks = featured(catalog);
  const now = useNow();
  return (
    <div className="flex flex-col gap-4">
      <Greeting
        eyebrow={now ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "\u00a0"}
        title={<h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-(--ink)">{`${now ? greeting(now) : "Hello"}, ${shopperName}`}</h1>}
      >
        <Brief orders={orders} />
      </Greeting>
      <Starters items={STARTERS} />
      <ArrivingPanel orders={orders} failed={ordersFailed} nouns={NOUNS} thumb={(order) => <OrderThumb order={order} />} onSeeAll={onSeeOrders} />
      {picks.length ? (
        <HomeSection title="Popular right now" subtitle="Bestsellers and new arrivals; open one to ask about it">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {picks.map((product) => (
              <ProductTile key={product.product_id} product={product} fluid onOpen={(item) => ask(`Tell me about the ${item.title}.`)} />
            ))}
          </div>
        </HomeSection>
      ) : null}
    </div>
  );
}
