
#from src.areas.receipts.models.image_training import ImageTraining
#from src.areas.receipts.services.database import DatabaseService


# class TrainingService:

#     def __init__(self) -> None:
#         pass

#     def add_receipt_training(self, image_path, json_response, json_metadata):
#         r"""
#         Add receipt training set to the database.
#         :param blob_name: str
#             The name of the blob to be saved.
#         :param response_json: dict
#             The response from the model.
#         :param json_metadata: dict
#             The metadata of the image.
#             This should be a dictionary containing the following:

#         """

#         # use database service to add image training set
#         db_service = DatabaseService()
#         db_service.add_image_traing_set(image_path=image_path, response=json_response, metadata=json_metadata)

#     def add_instore_training(receipt_id: int, instore_id: int):
#         pass

#     def add_chat_training(receipt_id: int, chat_id: int):
#         pass