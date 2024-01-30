FROM node:latest
WORKDIR /node_project
COPY ./package.json /node_project
RUN npm install
COPY ./* /node_project/
EXPOSE 3000
CMD npm start
