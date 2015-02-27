#include <pebble.h>

#define KEY_LOCA 0
#define KEY_DESC 1
#define KEY_TEMP 2
#define KEY_APPT 3

static Window    *s_main_window;
static TextLayer *headingLayer;
static TextLayer *middleLayer;
static TextLayer *bottomLayer;
static TextLayer *bottomRightLayer;
static TextLayer *bottomHeaderLayer;
static TextLayer *bottomRightHeaderLayer;

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
  Tuple *t = dict_read_first(iterator);
  
  char *KEY_LOCA_String = t->value->cstring;
  char *KEY_DESC_String = t->value->cstring;
  char *KEY_TEMP_String = t->value->cstring;
  char *KEY_APPT_String = t->value->cstring;
  
  while (t != NULL)
  {
    switch (t->key)
    {
      case KEY_LOCA:
        KEY_LOCA_String = t->value->cstring;
        break;
      case KEY_DESC:
        KEY_DESC_String = t->value->cstring;
        break;
      case KEY_TEMP:
        KEY_TEMP_String = t->value->cstring;
        break;
      case KEY_APPT:
        KEY_APPT_String = t->value->cstring;
        break;
    }
    t = dict_read_next(iterator);
  }
  
  //capitalising first letter of location and description
  if (KEY_LOCA_String[0] >= 97) KEY_LOCA_String[0] = KEY_LOCA_String[0] - 32;
  if (KEY_DESC_String[0] >= 97) KEY_DESC_String[0] = KEY_DESC_String[0] - 32;
  
  text_layer_set_text(headingLayer, KEY_LOCA_String);
  text_layer_set_text(middleLayer,  KEY_DESC_String);
  text_layer_set_text(bottomHeaderLayer, "Actual");
  text_layer_set_text(bottomRightHeaderLayer, "Feels Like");
  text_layer_set_text(bottomLayer,  KEY_TEMP_String);
  text_layer_set_text(bottomRightLayer, KEY_APPT_String);
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  text_layer_set_text(headingLayer, "Receive Failed!");
  APP_LOG(APP_LOG_LEVEL_ERROR, "Message dropped!");
}

static void outbox_failed_callback(DictionaryIterator *iterator, AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox send failed!");
}

static void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Outbox send success!");
}

static void main_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect window_bounds = layer_get_bounds(window_layer);

  //should add to 152
  int headingLayerHeight = 28;
  int middleLayerHeight  = 72;
  int bottomLayerHeight  = 52;
  
  middleLayer = text_layer_create(GRect(5, headingLayerHeight-8, window_bounds.size.w-5, middleLayerHeight));
  text_layer_set_font(middleLayer, fonts_get_system_font(FONT_KEY_GOTHIC_24));
  //text_layer_set_text_color(middleLayer, GColorWhite);
  //text_layer_set_background_color(middleLayer, GColorBlack);
  text_layer_set_overflow_mode(middleLayer, GTextOverflowModeWordWrap);
  layer_add_child(window_layer, text_layer_get_layer(middleLayer));
  
  bottomRightLayer = text_layer_create(GRect(((window_bounds.size.w / 2)-70), headingLayerHeight + middleLayerHeight+6, (window_bounds.size.w / 2)+65, bottomLayerHeight));
  text_layer_set_font(bottomRightLayer, fonts_get_system_font(FONT_KEY_BITHAM_42_MEDIUM_NUMBERS));
  //text_layer_set_text_color(bottomRightLayer, GColorWhite);
  //text_layer_set_background_color(bottomLayer, GColorClear);
  text_layer_set_overflow_mode(bottomRightLayer, GTextOverflowModeFill);
  text_layer_set_text_alignment(bottomRightLayer, GTextAlignmentRight);
  layer_add_child(window_layer, text_layer_get_layer(bottomRightLayer));
  
  bottomLayer = text_layer_create(GRect(5, headingLayerHeight + middleLayerHeight+6, (window_bounds.size.w / 2), bottomLayerHeight));
  text_layer_set_font(bottomLayer, fonts_get_system_font(FONT_KEY_BITHAM_42_MEDIUM_NUMBERS));
  //text_layer_set_text_color(bottomLayer, GColorWhite);
  //text_layer_set_background_color(bottomLayer, GColorClear);
  text_layer_set_overflow_mode(bottomLayer, GTextOverflowModeFill);
  text_layer_set_text_alignment(bottomLayer, GTextAlignmentLeft);
  layer_add_child(window_layer, text_layer_get_layer(bottomLayer));
  
  bottomHeaderLayer = text_layer_create(GRect(10, headingLayerHeight + middleLayerHeight-2, (window_bounds.size.w / 2), 16));
  text_layer_set_font(bottomHeaderLayer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  //text_layer_set_text_color(bottomHeaderLayer, GColorWhite);
  //text_layer_set_background_color(bottomHeaderLayer, GColorBlack);
  text_layer_set_overflow_mode(bottomHeaderLayer, GTextOverflowModeFill);
  text_layer_set_text_alignment(bottomHeaderLayer, GTextAlignmentLeft);
  layer_add_child(window_layer, text_layer_get_layer(bottomHeaderLayer));
  
  bottomRightHeaderLayer = text_layer_create(GRect((window_bounds.size.w / 2), headingLayerHeight + middleLayerHeight-2, (window_bounds.size.w / 2)-10, 16));
  text_layer_set_font(bottomRightHeaderLayer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  //text_layer_set_text_color(bottomRightHeaderLayer, GColorWhite);
  //text_layer_set_background_color(bottomRightHeaderLayer, GColorBlack);
  text_layer_set_overflow_mode(bottomRightHeaderLayer, GTextOverflowModeFill);
  text_layer_set_text_alignment(bottomRightHeaderLayer, GTextAlignmentRight);
  layer_add_child(window_layer, text_layer_get_layer(bottomRightHeaderLayer));
  
  headingLayer = text_layer_create(GRect(5, -5, window_bounds.size.w-5, headingLayerHeight));
  text_layer_set_font(headingLayer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  //text_layer_set_text_color(headingLayer, GColorWhite);
  //text_layer_set_background_color(headingLayer, GColorBlack);
  text_layer_set_text(headingLayer, "Loading Data...");
  text_layer_set_overflow_mode(headingLayer, GTextOverflowModeFill);
  layer_add_child(window_layer, text_layer_get_layer(headingLayer));
}

static void main_window_unload(Window *window) {
  // Destroy output TextLayer
  text_layer_destroy(headingLayer);
  text_layer_destroy(middleLayer);
  text_layer_destroy(bottomLayer);
  text_layer_destroy(bottomRightLayer);
  text_layer_destroy(bottomHeaderLayer);
  text_layer_destroy(bottomRightHeaderLayer);
}

static void init() {
  // Register callbacks
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);
   
  //todo - some notes for later
   //add persistent data for degrees c and f
   //add UP button trigger to swap between c and f (and save to persistence)
   //add receive functionality to grab config from pebble phone app config data (and save to persistence)
   //add app version control to persistence

  // Open AppMessage
  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());

  // Create main Window
  s_main_window = window_create();
  window_set_window_handlers(s_main_window, (WindowHandlers) {
    .load = main_window_load,
    .unload = main_window_unload
  });
  window_stack_push(s_main_window, true);
}

static void deinit() {
  // Destroy main Window
  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}