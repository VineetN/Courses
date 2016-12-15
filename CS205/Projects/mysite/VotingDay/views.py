from django.shortcuts import render
from .models import *
from django.template import loader
from django.http import HttpResponse
from django.db.models import Q, F
from django.http import HttpResponseRedirect
from .forms import UserForm


def index(request):
    event = User.objects.all()
    template=loader.get_template('index.html')
    context ={
        'event':event,
        }
    return HttpResponse(template.render(context,request))

def main(request):
    display = Candidate.objects.all()
    template=loader.get_template('main.html')
    context ={
        'display':display,
        }
    return HttpResponse(template.render(context,request))

def register(request):
    votebank = Vote.objects.all()
    template=loader.get_template('register.html')
    if request.method=='POST':
        keys = []
        for key, value in request.POST.iteritems():
            keys.append(key)
        keys.remove("csrfmiddlewaretoken")
        print keys
        if keys == ["group1"] or keys == ["group1", "NOTA+1"]:
            Vote.objects.filter(partyname="NOTA").update(totalvotes=F('totalvotes')+1)
        else:
            keys.remove("group1")
            partyNameAndIndex = keys[0].split("+")
            index = []
            for i in keys:
                x = i.split("+")
                index.append(x[1])
            index.sort(key=int)
            for i in index:
                print i
            party = partyNameAndIndex[0]
            print party
            if True:
                Vote.objects.filter(partyname=party).update(totalvotes=F('totalvotes')+1)
            if "1" in index:
                Vote.objects.filter(partyname=party).update(vote1=F('vote1')+1)
            if "2" in index:
                Vote.objects.filter(partyname=party).update(vote2=F('vote2')+1)
            if "3" in index:
                Vote.objects.filter(partyname=party).update(vote3=F('vote3')+1)
            if "4" in index:
                Vote.objects.filter(partyname=party).update(vote4=F('vote4')+1)
            if "5" in index:
                Vote.objects.filter(partyname=party).update(vote5=F('vote5')+1)
            if "6" in index:
                Vote.objects.filter(partyname=party).update(vote6=F('vote6')+1)
            if "7" in index:
                Vote.objects.filter(partyname=party).update(vote7=F('vote7')+1)
            if "8" in index:
                Vote.objects.filter(partyname=party).update(vote8=F('vote8')+1)
            if "9" in index:
                Vote.objects.filter(partyname=party).update(vote9=F('vote9')+1)
            if "10" in index:
                Vote.objects.filter(partyname=party).update(vote10=F('vote10')+1)
            if "11" in index:
                Vote.objects.filter(partyname=party).update(vote11=F('vote11')+1)
            if "12" in index:
                Vote.objects.filter(partyname=party).update(vote12=F('vote12')+1)
            if "13" in index:
                Vote.objects.filter(partyname=party).update(vote13=F('vote13')+1)
            if "14" in index:
                Vote.objects.filter(partyname=party).update(vote14=F('vote14')+1)
            if "15" in index:
                Vote.objects.filter(partyname=party).update(vote15=F('vote15')+1)
    return HttpResponse(template.render(request))

def results(request):
    template=loader.get_template('results.html')

    PartyName = [e.party_name for e in Candidate.objects.exclude(party_name="NOTA")]
    number_of_parties = int(len(PartyName))
    NOTA = int([e.totalvotes for e in Vote.objects.filter(partyname="NOTA")][0])
    Total = [int(e.totalvotes) for e in Vote.objects.exclude(partyname="NOTA")]

    Party = [0]* number_of_parties
    Party_votes = [0]* number_of_parties
    max_seats = [0]* number_of_parties
    Party_seats = [0]* number_of_parties
    zipped  = [0]* number_of_parties
    rzipped  = [0]* number_of_parties

    x=0
    y=0
    for e in Candidate.objects.exclude(party_name="NOTA"):
        Party[x] = [e.candidate1, e.candidate2, e.candidate3, e.candidate4, e.candidate5, e.candidate6, e.candidate7, e.candidate8, e.candidate9, e.candidate10, e.candidate11, e.candidate12, e.candidate13, e.candidate14, e.candidate15]
        Party[x] = [e for e in Party[x] if e != "NULL"]
        x+=1
    for e in Vote.objects.exclude(partyname="NOTA"):
        Party_votes[y] = [e.vote1, e.vote2, e.vote3, e.vote4, e.vote5, e.vote6, e.vote7, e.vote8, e.vote9, e.vote10, e.vote11, e.vote12, e.vote13, e.vote14, e.vote15]
        y+=1

    for i in range (0, number_of_parties):
        zipped[i] = zip(Party[i], Party_votes[i])
        rzipped[i] = sorted(zipped[i], key = lambda x: x[1], reverse = True)

    for i in range (0, number_of_parties):
            max_seats[i] = len(Party[i])

    number_of_voters = 322 #int(len([e.userid for e in User.objects.all()]))
    number_of_seats = 15
    extra = 0

    #basic structure of variables
    seats_left = number_of_seats
    number_of_people_who_voted = NOTA
    number_of_people_who_voted = 0
    for i in Total:
        number_of_people_who_voted += i
    number_of_people_who_didnt_vote = number_of_voters - number_of_people_who_voted
    election_quotient = number_of_voters / number_of_seats
    currentEQ = election_quotient
    percent_of_people_who_voted = ((number_of_people_who_voted * 1.0 / number_of_voters)) * 100
    percent_of_people_who_didnt_vote = ((number_of_people_who_didnt_vote * 1.0 / number_of_voters)) * 100

    # algorithm
    while (seats_left != 0) and (currentEQ != 0):
        for i in range (0, number_of_parties):
            no_of_seats = Total[i] / currentEQ
            if no_of_seats > max_seats[i]:
                number_of_seats = max_seats[i]
                Total[i] = 0
            Total[i] = (Total[i] % currentEQ)
            Party_seats[i] = Party_seats[i] + no_of_seats
            if Party_seats[i] > max_seats[i]:
                extra = Party_seats[i] - max_seats[i]
                Party_seats[i] = Party_seats[i] - extra
                Total[i] = 0
            seats_left = seats_left - no_of_seats + extra
        currentEQ = currentEQ - 1
        extra = 0

    context ={
        'PartyName':PartyName,
        'Party_seats':Party_seats,
        'rzipped':rzipped,
        'number_of_parties':number_of_parties
        }

    print
    print "Number of seats Won by each party:"
    print
    for i in range (0, number_of_parties):
        print PartyName[i]
        print Party_seats[i]
        print

    print "Meet the HORs:"
    for j in range (0, number_of_parties):
        for k in range (0, Party_seats[j]):
            print rzipped[j][k]
    print

    return HttpResponse(template.render(request))
