from django.urls import path
from . import views

urlpatterns = [
    path('solve/', views.solve_cube, name='solve'),
    path('detect-face/', views.detect_face, name='detect_face'),
]