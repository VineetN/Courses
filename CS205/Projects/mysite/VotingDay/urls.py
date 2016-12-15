from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^main.html', views.main, name='main'),
    url(r'^register.html', views.register, name='register'),
    url(r'^results.html', views.results, name='results')
]
