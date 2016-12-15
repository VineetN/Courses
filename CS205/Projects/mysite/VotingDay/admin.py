from django.contrib import admin
from .models import User, Candidate, Vote

class UserAdmin(admin.ModelAdmin):
    fields = ['email', 'userid']

class CandidateAdmin(admin.ModelAdmin):
    fieldsets = [
        ('Party Name',  {'fields': ['party_name']}),
        ('Candidates',  {'fields': ['candidate1']}),
        (None,          {'fields': ['candidate2']}),
        (None,          {'fields': ['candidate3']}),
        (None,          {'fields': ['candidate4']}),
        (None,          {'fields': ['candidate5']}),
        (None,          {'fields': ['candidate6']}),
        (None,          {'fields': ['candidate7']}),
        (None,          {'fields': ['candidate8']}),
        (None,          {'fields': ['candidate9']}),
        (None,          {'fields': ['candidate10']}),
        (None,          {'fields': ['candidate11']}),
        (None,          {'fields': ['candidate12']}),
        (None,          {'fields': ['candidate13']}),
        (None,          {'fields': ['candidate14']}),
        (None,          {'fields': ['candidate15']}),
    ]

class VoteAdmin(admin.ModelAdmin):
    fieldsets = [
        ('Party Name',  {'fields': ['partyname']}),
        ('Total Votes', {'fields': ['totalvotes']}),
        ('Votes',       {'fields': ['vote1']}),
        (None,          {'fields': ['vote2']}),
        (None,          {'fields': ['vote3']}),
        (None,          {'fields': ['vote4']}),
        (None,          {'fields': ['vote5']}),
        (None,          {'fields': ['vote6']}),
        (None,          {'fields': ['vote7']}),
        (None,          {'fields': ['vote8']}),
        (None,          {'fields': ['vote9']}),
        (None,          {'fields': ['vote10']}),
        (None,          {'fields': ['vote11']}),
        (None,          {'fields': ['vote12']}),
        (None,          {'fields': ['vote13']}),
        (None,          {'fields': ['vote14']}),
        (None,          {'fields': ['vote15']}),
    ]

admin.site.register(User, UserAdmin)
admin.site.register(Candidate, CandidateAdmin)
admin.site.register(Vote, VoteAdmin)
