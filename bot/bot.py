import logging
import os

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

from messages import WELCOME_MSG

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
LOGO = os.getenv("LOGO")
APP_URL = os.getenv("APP_URL", "https://dns.resistance.dog")


def _get_photo():
    if LOGO and os.path.isfile(LOGO):
        return open(LOGO, "rb")  # noqa: SIM115 — caller must close
    return LOGO


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton(text="Open App", web_app=WebAppInfo(url=APP_URL), api_kwargs={"style": "primary"})
    ]])
    photo = _get_photo()
    try:
        await update.message.reply_photo(
            photo=photo,
            caption=WELCOME_MSG,
            parse_mode="HTML",
            reply_markup=keyboard,
        )
    finally:
        if hasattr(photo, "close"):
            photo.close()


def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is not set")
    logger.info("Starting bot (APP_URL=%s)", APP_URL)
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.run_polling()


if __name__ == "__main__":
    main()
