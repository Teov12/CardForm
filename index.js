import open from "open";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import express from "express";
import hbs from "hbs";
import { urlencoded, json } from "express";
import { Payment, MercadoPagoConfig } from "mercadopago";

const mercadoPagoPublicKey = "TEST-e6c40772-380b-4a98-a5d8-7457d19b67e3";
if (!mercadoPagoPublicKey) {
  console.log("Error: public key not defined");
  process.exit(1);
}

const mercadoPagoAccessToken =
  "TEST-7180234871684665-090608-4f2f590bba9103f62d768c405d23c812-291165541";
if (!mercadoPagoAccessToken) {
  console.log("Error: access token not defined");
  process.exit(1);
}

const client = new MercadoPagoConfig({
  accessToken:
    "TEST-7180234871684665-090608-4f2f590bba9103f62d768c405d23c812-291165541",
});
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set("view engine", "html");
app.engine("html", hbs.__express);
app.set("views", join(__dirname, "views"));

app.use(urlencoded({ extended: false }));
app.use(express.static(__dirname + "/static"));
app.use(json());

app.get("/", function (req, res) {
  res.status(200).render("index", { mercadoPagoPublicKey });
});

app.post("/process_payment", (req, res) => {
  const { body } = req;
  const { payer } = body;

  const payment = new Payment(client);

  const paymentData = {
    transaction_amount: Number(body.amount),
    token: body.token,
    description: body.description,
    installments: Number(body.installments),
    payment_method_id: body.paymentMethodId,
    issuer_id: body.issuerId,
    payer: {
      email: payer.email,
      identification: {
        type: payer.identification.docType,
        number: payer.identification.docNumber,
      },
    },
  };

  payment
    .create({ body: paymentData })
    .then(function (data) {
      res.status(201).json({
        detail: data.status_detail,
        status: data.status,
        id: data.id,
      });
      console.log(data.status, data.status_detail, data.id);
      console.log("ok");
      console.log("ok2");
    })
    .catch(function (error) {
      console.log(error);
      const { errorMessage, errorStatus } = validateError(error);
      res.status(errorStatus).json({ error_message: errorMessage });
    });
});

function validateError(error) {
  let errorMessage = "Unknown error cause";
  let errorStatus = 400;

  if (error.cause) {
    const sdkErrorMessage = error.cause[0].description;
    errorMessage = sdkErrorMessage || errorMessage;

    const sdkErrorStatus = error.status;
    errorStatus = sdkErrorStatus || errorStatus;
  }

  return { errorMessage, errorStatus };
}

app.listen(8080, () => {
  console.log("The server is now running on port 8080");
  open("http://localhost:8080");
});
