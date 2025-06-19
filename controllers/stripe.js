const Model = require("../models");
const { logger } = require("../Logs/logger.js");
const { successResponse, failureResponse } = require("../utils/response.js");
const { Op, Sequelize, where } = require("sequelize");
const { CLASSROOM_STATUS } = require("../utils/enumTypes.js");
const school = require("../models/school");

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const endpoint_secret =
  "whsec_8158a0cb7aa716efaa50effd42e3299a3da1eb1b9c284bc7dbbecf4eeeb05239";

const stripeRedirection = async (req, res) => {
  try {
    // const {email, price} =

    const price=  1000
   
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd', // Change to your preferred currency
            product_data: {
              name: 'Product 1',
            },
            unit_amount: price * 100, // Stripe expects amounts to be in the smallest currency unit (e.g., cents for USD)
          },
          quantity: 1,
        },
      ],
      // customer_email: email, // Optional: Attach the email to the session
      success_url: 'https://your-website.com/success',
      cancel_url: 'https://your-website.com/cancel',
    });
    

    return successResponse(res, 200, "Payment has been done",session);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const stripeNotification = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const payload = req.rawBody;

  // console.log("Received webhook payload:", payload); // Log the payload directly without calling toString()

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpoint_secret);

    switch (event.type) {
      case "checkout.session.completed":
        const checkout = event.data.object;
        const orderId = checkout.metadata.order_id;

        console.log(checkout);

        const transaction = await Model.sequelize.transaction(); // Start a transaction

        try {
          // Update payment
          await Model.Payment.update(
            {
              payment_status: checkout.payment_status,
              payment_date: new Date(),
            },
            {
              where: {
                order_id: orderId,
              },
              transaction, // Pass transaction to the update operation
            }
          );

          if (checkout.payment_status === "paid") {
            const orderVariant = await Model.OrderProduct.findAll({
              attributes: ["variant_id", "quantity"],
              where: {
                order_id: orderId,
              },
              raw: true,
              transaction, // Pass transaction to the findAll operation
            });

            console.log(orderVariant);

            for (let i = 0; i < orderVariant.length; i++) {
              const variant = await Model.Variant.findOne({
                attributes: ["id", "product_id", "quantity"],
                where: {
                  id: orderVariant[i].variant_id,
                },
                transaction,
              });

              console.log(variant);

              variant.quantity -= parseInt(orderVariant[i].quantity);

              await variant.save({ transaction });

              const product = await Model.Product.findOne({
                attributes: ["id", "stock"],
                where: {
                  id: variant.product_id,
                },
                transaction, // Pass transaction to the findOne operation
              });

              product.stock -= parseInt(orderVariant[i].quantity);

              await product.save({ transaction }); // Pass transaction to the save operation
            }
          }

          await transaction.commit(); // Commit the transaction if all operations succeed

          console.log("Transaction completed successfully");
        } catch (error) {
          console.error("Transaction failed:", error);
          await transaction.rollback(); // Rollback the transaction if any operation fails
        }
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (err) {
    console.log("⚠️  Webhook signature verification failed:", err.message);
    return res.sendStatus(400);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ success: true });
};

module.exports = { stripeRedirection, stripeNotification };
