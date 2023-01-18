###############################
# BUILD FOR LOCAL DEVELOPMENT #
###############################

FROM node:18 As development

RUN apt-get update && apt-get install -y openssl

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND yarnlock (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package.json yarn.lock ./
COPY prisma ./prisma

# Install app dependencies using the `yarn install` command
RUN yarn install

# Bundle app source
COPY --chown=node:node . .

RUN yarn prisma:generate

# Use the node user from the image (instead of the root user)
USER node

########################
# BUILD FOR PRODUCTION #
########################

FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock ./
COPY prisma ./prisma

# In order to run `npm run build` we need access to the Nest CLI.
# The Nest CLI is a dev dependency,
# In the previous development stage we ran `yarn install` which installed all dependencies.
# So we can copy over the node_modules directory from the development image into this build image.
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN yarn build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Running `npm ci` removes the existing node_modules directory.
# Passing in --only=production ensures that only the production dependencies are installed.
# This ensures that the node_modules directory is as optimized as possible.
RUN yarn install --only=production && yarn cache clean --force

USER node

##############
# PRODUCTION #
##############

FROM node:18-alpine As production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/package.json /usr/src/app/yarn.lock ./
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
# Copy prisma directory
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma

# Start the server using the production build
CMD [ "yarn", "start:migrate:prod" ]
