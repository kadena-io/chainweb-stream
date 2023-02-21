FROM node:18-bullseye

WORKDIR /app
COPY . .

RUN apt install git
#RUN npm i -g yarn
RUN yarn

EXPOSE 3000
CMD ["npm", "run", "start"]
