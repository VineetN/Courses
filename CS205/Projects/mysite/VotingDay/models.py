from __future__ import unicode_literals
from django.db import models

class User(models.Model):
    email = models.CharField(max_length=50)
    userid = models.CharField(max_length=15)
    def __unicode__(self):
        return self.userid

class Candidate(models.Model):
    party_name = models.CharField(max_length=100, null=False, blank=False)
    candidate1 = models.CharField(max_length=50, null=False, blank=False)
    candidate2 = models.CharField(max_length=50, null=True, blank=True)
    candidate3 = models.CharField(max_length=50, null=True, blank=True)
    candidate4 = models.CharField(max_length=50, null=True, blank=True)
    candidate5 = models.CharField(max_length=50, null=True, blank=True)
    candidate6 = models.CharField(max_length=50, null=True, blank=True)
    candidate7 = models.CharField(max_length=50, null=True, blank=True)
    candidate8 = models.CharField(max_length=50, null=True, blank=True)
    candidate9 = models.CharField(max_length=50, null=True, blank=True)
    candidate10 = models.CharField(max_length=50, null=True, blank=True)
    candidate11 = models.CharField(max_length=50, null=True, blank=True)
    candidate12 = models.CharField(max_length=50, null=True, blank=True)
    candidate13 = models.CharField(max_length=50, null=True, blank=True)
    candidate14 = models.CharField(max_length=50, null=True, blank=True)
    candidate15 = models.CharField(max_length=50, null=True, blank=True)
    def __unicode__(self):
        return self.party_name

class Vote(models.Model):
    partyname = models.CharField(max_length=100, null=False, blank=False)
    totalvotes = models.IntegerField(default=0)
    vote1 = models.IntegerField(default=0)
    vote2 = models.IntegerField(default=0)
    vote3 = models.IntegerField(default=0)
    vote4 = models.IntegerField(default=0)
    vote5 = models.IntegerField(default=0)
    vote6 = models.IntegerField(default=0)
    vote7 = models.IntegerField(default=0)
    vote8 = models.IntegerField(default=0)
    vote9 = models.IntegerField(default=0)
    vote10 = models.IntegerField(default=0)
    vote11 = models.IntegerField(default=0)
    vote12 = models.IntegerField(default=0)
    vote13 = models.IntegerField(default=0)
    vote14 = models.IntegerField(default=0)
    vote15 = models.IntegerField(default=0)
    def __unicode__(self):
        return self.partyname
