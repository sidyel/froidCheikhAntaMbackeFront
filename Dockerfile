# Étape 1 : Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Étape 2 : Servir avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist/froid-cheikh-ecommerce-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["/bin/sh", "-c", "sed -i 's/$PORT/'$PORT'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
