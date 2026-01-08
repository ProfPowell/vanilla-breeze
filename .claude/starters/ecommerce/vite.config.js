import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        products: resolve(__dirname, 'src/pages/products.html'),
        product: resolve(__dirname, 'src/pages/product.html'),
        cart: resolve(__dirname, 'src/pages/cart.html'),
        checkout: resolve(__dirname, 'src/pages/checkout.html'),
        orders: resolve(__dirname, 'src/pages/orders.html'),
        order: resolve(__dirname, 'src/pages/order.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});