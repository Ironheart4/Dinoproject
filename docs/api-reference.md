# API Reference

Route paths below reflect the Express routers in `routes/`. Auth is enforced by Supabase JWT middleware; admin routes additionally require the local `admin` role.

## Health and root

`/` `GET` public
`/health` `GET` public
`/health/db` `GET` public, database connectivity check

## Authentication

`/api/auth/register` `POST` public
`/api/auth/login` `POST` public
`/api/auth/logout` `POST` public
`/api/auth/refresh` `POST` public
`/api/auth/me` `GET` authenticated

## Dinosaurs

`/api/dinosaurs` `GET` public
`/api/dinosaurs` `POST` admin
`/api/dinosaurs/featured` `GET` public
`/api/dinosaurs/:id` `GET` public
`/api/dinosaurs/:id` `PUT` admin
`/api/dinosaurs/:id` `DELETE` admin

## Quizzes and scores

`/api/quizzes` `GET` public
`/api/quizzes` `POST` admin
`/api/quizzes/recommend` `GET` authenticated
`/api/quizzes/:id` `GET` public
`/api/quizzes/:id` `PUT` admin
`/api/quizzes/:id` `DELETE` admin
`/api/quiz/random` `GET` public
`/api/scores` `POST` authenticated
`/api/scores` `GET` authenticated
`/api/scores/me` `GET` authenticated

## Users and analytics

`/api/users` `GET` admin
`/api/users/:id/role` `PUT` admin
`/api/analytics` `GET` admin

## Forum

`/api/forum/categories` `GET` public
`/api/forum/posts/recent` `GET` public
`/api/forum/category/:slug` `GET` public
`/api/forum/post/:id` `GET` public
`/api/forum/posts` `POST` authenticated
`/api/forum/posts/:id/replies` `POST` authenticated

## Subscriptions and favorites

`/api/subscription` `GET` authenticated
`/api/subscription` `POST` admin
`/api/subscription` `DELETE` authenticated
`/api/favorites` `GET` authenticated
`/api/favorites` `POST` authenticated
`/api/favorites/check/:dinoId` `GET` authenticated
`/api/favorites/:dinoId` `DELETE` authenticated

## Dashboard and profile

`/api/dashboard/stats` `GET` authenticated
`/api/dashboard/charts` `GET` authenticated
`/api/dashboard/activity` `GET` authenticated
`/api/user/profile` `PUT` authenticated
`/api/user/profile-pic` `POST` authenticated
`/api/user/profile-pic` `DELETE` authenticated
`/api/user/me` `GET` authenticated

## PayPal and AI

`/api/paypal/create-order` `POST` authenticated
`/api/paypal/capture-order` `POST` authenticated
`/api/paypal/client-id` `GET` public
`/api/ai/chat` `POST` authenticated, Premium/Donor or admin

## Search

`/api/search` `GET` public
